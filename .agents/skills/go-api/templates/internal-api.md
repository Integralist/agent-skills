# cmd/api and internal/api

`main` stays thin and hands off to `run`, which hands off to `api.Run`, as
conventions-go's Commands section requires. `api.Run` builds the servers and
blocks until the context is cancelled, then shuts down gracefully.

## cmd/api/main.go

```go
// cmd/api/main.go

package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"{MODULE_PATH}/internal/api"
	"{MODULE_PATH}/internal/config"
	"{MODULE_PATH}/internal/logx"
)

// Build details, overridden at link time with -ldflags "-X main.version=…",
// so the healthcheck reports exactly which build is running.
var (
	// version is the release version, or "dev" for a local build.
	version = "dev"
	// gitCommit is the commit the binary was built from.
	gitCommit = "unknown"
	// buildDate is when the binary was built.
	buildDate = "unknown"
)

// main parses flags, builds the logger, and cancels the context on SIGINT or
// SIGTERM, then hands off to run so the program logic stays testable.
func main() {
	cfgPath := flag.String("cfg", "./local/config/api.json", "path to the JSON config file")
	flag.Parse()

	logx.AppName = "{SERVICE_NAME}"
	logx.AppVersion = version
	logger := logx.New()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	err := run(ctx, logger, *cfgPath)
	stop() // os.Exit skips deferred calls, so release the signal handler first.
	if err != nil {
		logger.LogAttrs(ctx, slog.LevelError, "run", slog.Any("err", err))
		os.Exit(1)
	}
}

// run loads and validates the config, then serves until ctx is cancelled.
// It returns errors rather than exiting, so main is the only caller of
// os.Exit.
func run(ctx context.Context, logger *slog.Logger, cfgPath string) error {
	cfg, err := config.Load(cfgPath)
	if err != nil {
		return fmt.Errorf("main: failed to load config: %w", err)
	}
	if err := cfg.Validate(); err != nil {
		return fmt.Errorf("main: invalid config: %w", err)
	}

	return api.Run(ctx, logger, cfg, api.BuildInfo{
		Version:   version,
		GitCommit: gitCommit,
		BuildDate: buildDate,
		GoVersion: runtime.Version(),
	})
}
```

## internal/api/api.go

```go
// internal/api/api.go

package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/otel"

	"{MODULE_PATH}/internal/config"
	"{MODULE_PATH}/internal/contextx"
	"{MODULE_PATH}/internal/deps"
	"{MODULE_PATH}/internal/metrics"
	"{MODULE_PATH}/internal/middleware"
	"{MODULE_PATH}/internal/mysql"
	"{MODULE_PATH}/internal/redis"
	"{MODULE_PATH}/internal/traces"
)

const (
	// component labels this binary's logs, metrics, and traces, so signals
	// from several binaries in one service can be told apart.
	component = "api"
	// defaultReadTimeout bounds how long a client may take to send a request,
	// so slow clients can't hold connections open. Config can override it.
	defaultReadTimeout = 10 * time.Second
	// defaultWriteTimeout bounds how long a handler may take to respond.
	// Config can override it.
	defaultWriteTimeout = 10 * time.Second
	// shutdownTimeout caps graceful shutdown, so in-flight requests get time
	// to finish without blocking a deploy indefinitely.
	shutdownTimeout = 15 * time.Second
)

// BuildInfo identifies the running build, so the healthcheck can say which
// version is deployed.
type BuildInfo struct {
	// Version is the release version, or "dev" for a local build.
	Version string
	// GitCommit is the commit the binary was built from.
	GitCommit string
	// BuildDate is when the binary was built.
	BuildDate string
	// GoVersion is the Go toolchain that built the binary.
	GoVersion string
}

// Run starts the API and metrics servers and blocks until ctx is cancelled,
// then shuts both down gracefully. A dependency that fails to start is
// logged and recorded rather than fatal, so the healthcheck stays reachable
// and other routes answer 503.
func Run(ctx context.Context, l *slog.Logger, cfg *config.Config, buildInfo BuildInfo) error {
	ctx = contextx.WithComponent(ctx, component)

	// d records which hard dependencies failed to start, so middleware can
	// answer 503 consistently instead of each handler failing its own way.
	d := deps.Dependencies{}

	// Tracing is best effort: the API still serves without it.
	traceShutdown, _, err := traces.New(ctx, "{SERVICE_NAME}-"+component)
	if err != nil {
		l.LogAttrs(ctx, slog.LevelError, "trace_create",
			slog.Any("err", fmt.Errorf("api: failed to start tracing: %w", err)))
	}
	defer func() {
		if traceShutdown == nil {
			return
		}
		// WithoutCancel lets buffered spans flush after ctx is cancelled.
		if err := traceShutdown(context.WithoutCancel(ctx)); err != nil {
			l.LogAttrs(ctx, slog.LevelError, "trace_shutdown", slog.Any("err", err))
		}
	}()

	registry := prometheus.NewRegistry()
	metric := metrics.New(registry, component, l)
	createMetricStore(metric, component)
	ms := metric.StartServer(ctx, l, cfg.Metrics.Host, cfg.Metrics.Port)

	redisClient, err := redis.NewClient(ctx, l, cfg)
	if err != nil {
		l.LogAttrs(ctx, slog.LevelError, "redis_create",
			slog.Any("err", fmt.Errorf("api: failed to create redis client: %w", err)))
		d.RedisFailed = true
	}
	_ = redisClient // Pass to the business layer once it exists.

	db, err := mysql.New(ctx, cfg.MySQL, l)
	if err != nil {
		l.LogAttrs(ctx, slog.LevelError, "mysql_create",
			slog.Any("err", fmt.Errorf("api: failed to start mysql: %w", err)))
		d.MySQLFailed = true
	} else {
		defer db.Close()
	}

	// The order matters: see the middleware README for why each sits where
	// it does.
	middlewareTracer := otel.Tracer("internal.middleware")
	muxAPI := http.NewServeMux()
	pipeline := middleware.New(
		middleware.PanicRecovery(l, metric),
		middleware.AddRoutePattern(muxAPI),
		middleware.TraceRequestData,
		middleware.TraceResponseData,
		middleware.WithMetrics(metric, middlewareTracer),
		middleware.WithDependencies(l, d),
		middleware.LogRouteAndTraceID(l, middlewareTracer),
		middleware.InFlight(metric, middlewareTracer),
	)
	// The healthcheck skips the dependency check, so it answers even when
	// MySQL or Redis is down.
	hc := middleware.New(metric.WithHealthCheckMetrics)

	muxAPI.Handle("GET /healthcheck", hc.Decorate(healthcheck(l, buildInfo)))
	// Register domain handlers here, for example:
	// domain.NewHandlers(l, metric, svc).RegisterRoutes(muxAPI, pipeline, cfg)
	_ = pipeline

	s := &http.Server{
		Addr:         cfg.Addr,
		Handler:      muxAPI,
		ReadTimeout:  parseTimeout(cfg.Timeouts.APIReadTimeout, defaultReadTimeout),
		WriteTimeout: parseTimeout(cfg.Timeouts.APIWriteTimeout, defaultWriteTimeout),
	}

	// serveErr carries ListenAndServe's result, so a failure to bind ends Run
	// instead of leaving it waiting on ctx.
	serveErr := make(chan error, 1)
	go func() {
		l.LogAttrs(ctx, slog.LevelInfo, "api_start", slog.String("addr", cfg.Addr))
		serveErr <- s.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		return fmt.Errorf("api: failed to serve: %w", err)
	case <-ctx.Done():
	}

	l.LogAttrs(ctx, slog.LevelWarn, "api_shutdown", slog.Any("cause", context.Cause(ctx)))
	shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), shutdownTimeout)
	defer cancel()

	return errors.Join(
		shutdown(shutdownCtx, "api", s),
		shutdown(shutdownCtx, "metrics", ms),
	)
}

// shutdown stops srv gracefully and names it in any error, so a failed
// drain says which server it was.
func shutdown(ctx context.Context, name string, srv *http.Server) error {
	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("api: failed to stop %s server: %w", name, err)
	}
	return nil
}

// parseTimeout returns the configured duration, or def when none is set.
// config.Validate rejects malformed values, so a parse error can't reach
// here unnoticed.
func parseTimeout(s string, def time.Duration) time.Duration {
	if d, err := time.ParseDuration(s); err == nil {
		return d
	}
	return def
}

// healthcheck reports the build and uptime, so deploy checks and humans can
// confirm which version is serving and since when.
func healthcheck(l *slog.Logger, buildInfo BuildInfo) http.Handler {
	startTime := time.Now()
	hostname, _ := os.Hostname()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := map[string]string{
			"build_date": buildInfo.BuildDate,
			"git_commit": buildInfo.GitCommit,
			"go_version": buildInfo.GoVersion,
			"hostname":   hostname,
			"launch":     startTime.Format(time.RFC3339),
			"uptime":     time.Since(startTime).Truncate(time.Second).String(),
			"version":    buildInfo.Version,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(response); err != nil {
			l.LogAttrs(r.Context(), slog.LevelError, "healthcheck", slog.Any("err", err))
		}
	})
}

// createMetricStore registers every metric the service records up front, so
// a typo in a metric name fails at startup rather than silently dropping
// data.
func createMetricStore(m *metrics.Metrics, component string) {
	m.StoreCreate(&metrics.Store{
		Component: component,
		Counters:  []string{},
		CounterVecs: [][]string{
			{"api_operations_total", "endpoint", "method", "result"},
			{"db_operations_total", "operation", "table", "result"},
			{"cache_operations_total", "operation", "cache_type", "result"},
			{"panics_total", "panic"},
		},
		Histograms: []string{},
		HistogramVecs: [][]string{
			{"db_operation_duration_seconds", "operation", "table", "result"},
			{"cache_operation_duration_seconds", "operation", "result"},
			{"service_operation_duration_seconds", "operation", "result"},
		},
	})
}
```

## internal/api/README.md

````markdown
# internal/api

Builds and runs the HTTP API: server lifecycle, graceful shutdown, the
middleware pipeline, route registration, the healthcheck, and metric
registration.

`cmd/api/main.go` calls `api.Run(ctx, logger, cfg, buildInfo)`, which blocks
until `ctx` is cancelled. Register domain routes in `Run`, after the pipeline
is built.
````
