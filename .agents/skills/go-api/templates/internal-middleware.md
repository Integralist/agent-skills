# internal/middleware

The middleware pipeline for cross-cutting concerns: panic recovery, tracing,
metrics, dependency checks, and request logging. `Decorator` and `Pipeline`
follow the service architecture's middleware pattern.

## middleware.go

```go
// internal/middleware/middleware.go

package middleware

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"runtime/debug"
	"slices"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"{MODULE_PATH}/internal/contextx"
	"{MODULE_PATH}/internal/deps"
	"{MODULE_PATH}/internal/httpx"
	"{MODULE_PATH}/internal/metrics"
	"{MODULE_PATH}/internal/traces"
)

// routePattern captures each {name} in a route pattern, so path parameters
// can be logged and traced by name.
var routePattern = regexp.MustCompile(`\{([^{}]+)\}`)

// Decorator adds one cross-cutting behaviour to a handler, so concerns like
// logging and metrics stay out of handler code.
type Decorator func(http.Handler) http.Handler

// Pipeline holds the middleware every route shares, so the chain is defined
// once.
type Pipeline struct {
	// middleware runs in slice order, first entry outermost.
	middleware []Decorator
}

// New returns a Pipeline that applies middleware in the order given.
func New(middleware ...Decorator) *Pipeline {
	return &Pipeline{middleware: slices.Clone(middleware)}
}

// Decorate wraps next in the pipeline's middleware, applied in reverse so the
// first entry runs first.
func (p *Pipeline) Decorate(next http.Handler) http.Handler {
	for _, mw := range slices.Backward(p.middleware) {
		next = mw(next)
	}
	return next
}

// AddRoutePattern stores the matched route pattern, such as
// "GET /items/{id}", in the request context, so logs, traces, and metrics
// group by route rather than by raw path.
func AddRoutePattern(mux *http.ServeMux) Decorator {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, route := mux.Handler(r)
			ctx := context.WithValue(r.Context(), contextx.RoutePatternContextKey, route)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// InFlight tracks how many requests are being handled right now, which shows
// saturation before latency does.
func InFlight(m *metrics.Metrics, tracer trace.Tracer) Decorator {
	active := m.RegisterGauge("api_requests_inflight_count")
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, span := tracer.Start(r.Context(), "middleware.InFlight")
			defer span.End()

			active.Inc()
			defer active.Dec()
			next.ServeHTTP(w, r)
		})
	}
}

// LogRouteAndTraceID logs one line per request with its route, path
// parameters, status, size, and duration, tagged with the trace ID so a log
// line leads straight to its trace.
func LogRouteAndTraceID(l *slog.Logger, tracer trace.Tracer) Decorator {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			_, span := tracer.Start(ctx, "middleware.LogRouteAndTraceID")
			defer span.End()

			start := time.Now()
			route, _ := contextx.RoutePatternFromContext(ctx)

			reqAttrs := []any{
				slog.String("pattern", route),
				slog.String("http_method", r.Method),
				slog.String("user_agent", r.Header.Get("User-Agent")),
			}
			if segments := routePattern.FindAllStringSubmatch(route, -1); len(segments) > 0 {
				pathSegs := []any{}
				for _, seg := range segments {
					if len(seg) == 2 {
						pathSegs = append(pathSegs, slog.String(seg[1], r.PathValue(seg[1])))
					}
				}
				reqAttrs = append(reqAttrs, slog.Group("path_segs", pathSegs...))
			}

			sl := l
			if traceID := traces.GetTraceID(ctx); traceID != "" {
				sl = sl.With(slog.String("trace_id", traceID))
			}

			ww := &wrappedWriter{ResponseWriter: w}
			defer func() {
				dur := time.Since(start)
				span.SetAttributes(
					attribute.Int("http.response.status_code", ww.status),
					attribute.Int("http.response.body.size", ww.bytesWritten),
					attribute.Int64("http.response.duration_ms", dur.Milliseconds()),
				)

				reqAttrs = append(reqAttrs,
					slog.String("proto", r.Proto),
					slog.String("query", r.URL.RawQuery),
				)
				resAttrs := []any{
					slog.Int("bytes_written", ww.bytesWritten),
					slog.Int("status_code", ww.status),
					slog.Int64("duration", dur.Milliseconds()),
					slog.String("time", time.Now().Format(time.RFC3339)),
				}

				// A status of 0 means the handler never wrote a response.
				level := slog.LevelInfo
				if ww.status >= http.StatusInternalServerError || ww.status == 0 {
					level = slog.LevelError
				}
				sl.LogAttrs(ctx, level, "handler_finished",
					slog.Group("request", reqAttrs...),
					slog.Group("response", resAttrs...),
				)
			}()

			next.ServeHTTP(ww, r)
		})
	}
}

// PanicRecovery logs and counts a handler panic with its stack trace, then
// re-panics so net/http still aborts the connection as it would have.
func PanicRecovery(l *slog.Logger, m *metrics.Metrics) Decorator {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			defer func() {
				rec := recover()
				if rec == nil {
					return
				}

				// http.ErrAbortHandler is how a handler deliberately aborts a
				// response, so it isn't logged as an error.
				panicType, level := "Unknown", slog.LevelError
				if err, ok := rec.(error); ok && errors.Is(err, http.ErrAbortHandler) {
					panicType, level = "ErrAbortHandler", slog.LevelInfo
				}

				l.LogAttrs(ctx, level, "panic_recovered",
					slog.Group("request",
						slog.String("method", r.Method),
						slog.String("path", r.URL.Path),
					),
					slog.String("panic", panicType),
					slog.String("stack_trace", string(debug.Stack())),
				)
				m.Count(ctx, "panics_total", "panic="+panicType)

				panic(rec)
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// WithDependencies answers 503 while MySQL or Redis is unavailable, so
// clients get a clear, retryable error instead of a half-working response.
func WithDependencies(l *slog.Logger, d deps.Dependencies) Decorator {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if d.MySQLFailed || d.RedisFailed {
				sl := l.With(slog.Group("request",
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
				))
				httpx.WriteJSON(r.Context(), sl, w, http.StatusServiceUnavailable,
					map[string]string{"error": "Service Unavailable", "detail": "Missing dependencies"})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// WithMetrics records request count, duration, and request and response
// sizes per route, with the trace ID as an exemplar so a slow bucket links
// to an example trace.
func WithMetrics(m *metrics.Metrics, tracer trace.Tracer) Decorator {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, span := tracer.Start(r.Context(), "middleware.WithMetrics")
			defer span.End()

			routeOption := promhttp.WithLabelFromCtx("route", routeFromContext)
			routeAndTrace := []promhttp.Option{
				routeOption,
				promhttp.WithExemplarFromContext(traceIDExemplar),
			}

			handler := promhttp.InstrumentHandlerCounter(
				m.RequestsTotal(),
				promhttp.InstrumentHandlerDuration(
					m.RequestDuration(),
					promhttp.InstrumentHandlerRequestSize(
						m.RequestSize(),
						promhttp.InstrumentHandlerResponseSize(
							m.ResponseSize(),
							next,
							routeOption,
						),
						routeOption,
					),
					routeAndTrace...,
				),
				routeAndTrace...,
			)
			handler.ServeHTTP(w, r)
		})
	}
}

// TraceRequestData starts a server span per request, named by route pattern
// so traces group like metrics do. The healthcheck is skipped because its
// spans are noise.
func TraceRequestData(next http.Handler) http.Handler {
	return otelhttp.NewHandler(next, "server",
		otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
		otelhttp.WithFilter(func(r *http.Request) bool {
			return r.URL.Path != "/healthcheck"
		}),
		otelhttp.WithSpanNameFormatter(func(_ string, r *http.Request) string {
			if route, ok := contextx.RoutePatternFromContext(r.Context()); ok {
				return route
			}
			return fmt.Sprintf("%s %s", r.Method, r.URL.Path)
		}),
	)
}

// TraceResponseData adds path parameters to the request span and sets its
// status from the response code, so failed requests show as errors in the
// trace view.
func TraceResponseData(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ww := &wrappedWriter{ResponseWriter: w}
		span := trace.SpanFromContext(r.Context())

		if span.IsRecording() {
			if route, ok := contextx.RoutePatternFromContext(r.Context()); ok {
				for _, seg := range routePattern.FindAllStringSubmatch(route, -1) {
					if len(seg) == 2 {
						span.SetAttributes(attribute.String("http.path."+seg[1], r.PathValue(seg[1])))
					}
				}
			}
		}

		defer func() {
			if !span.IsRecording() {
				return
			}
			switch {
			case ww.status == 0:
				span.SetStatus(codes.Error, "No HTTP status set")
			case ww.status >= http.StatusBadRequest:
				span.SetStatus(codes.Error, fmt.Sprintf("HTTP %d", ww.status))
			default:
				span.SetStatus(codes.Ok, "")
			}
		}()

		next.ServeHTTP(ww, r)
	})
}

// routeFromContext returns the stored route pattern for the metrics route
// label, or "" when none was stored.
func routeFromContext(ctx context.Context) string {
	route, _ := contextx.RoutePatternFromContext(ctx)
	return route
}

// traceIDExemplar attaches the trace ID to a metric observation, so Grafana
// can jump from a metric to the trace behind it.
func traceIDExemplar(ctx context.Context) prometheus.Labels {
	if traceID := traces.GetTraceID(ctx); traceID != "" {
		return prometheus.Labels{"traceID": traceID}
	}
	return nil
}

// wrappedWriter records the status and bytes a handler writes, which
// http.ResponseWriter doesn't expose.
type wrappedWriter struct {
	http.ResponseWriter
	// status is the response code; 0 until the handler writes.
	status int
	// bytesWritten is the response body size so far.
	bytesWritten int
}

// WriteHeader records the status before passing it on.
func (ww *wrappedWriter) WriteHeader(status int) {
	ww.ResponseWriter.WriteHeader(status)
	ww.status = status
}

// Write records the body size, and a 200 status if the handler wrote a body
// without calling WriteHeader, matching net/http's own default.
func (ww *wrappedWriter) Write(data []byte) (int, error) {
	if ww.status == 0 {
		ww.status = http.StatusOK
	}
	n, err := ww.ResponseWriter.Write(data)
	ww.bytesWritten += n
	return n, err
}
```

## README.md

````markdown
# internal/middleware

Cross-cutting HTTP concerns, composed into one `Pipeline` that every route
shares.

The first middleware passed to `New` is outermost: it sees the request first
and the response last. Keep this order:

1. `PanicRecovery`, outermost, so it catches panics from everything inside.
2. `AddRoutePattern`, because tracing, metrics, and logging all read the
   route.
3. `TraceRequestData`, to start the span early.
4. `TraceResponseData`, to set the span's status from the response.
5. `WithMetrics`, to record request metrics.
6. `WithDependencies`, to answer 503 when MySQL or Redis is down.
7. `LogRouteAndTraceID`, to log with the full context.
8. `InFlight`, to count active requests.

```go
mux.Handle("GET /items", pipeline.Decorate(handler))
```
````
