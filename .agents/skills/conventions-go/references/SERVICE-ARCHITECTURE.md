# Go Service Architecture

The house architecture for an HTTP/API service: handlers → service →
repository, with tracing, metrics, caching, and middleware at the layer
boundaries. Use it when building or extending a service of that shape, on top
of [conventions-go](../SKILL.md). Helper names here (`errorsx`, `httpx`,
`traces.WithSpan`, `withDBMetrics`, `middleware.Pipeline`, `CacheManager`)
show the pattern; in an existing repo, use its equivalents.

**Layers.** Requests flow handlers → service → repository, and no layer skips
the next. Business logic lives in the service and data access in the
repository.

**Files.** Split each layer by resource: `handlers.go` plus `handlers_*.go`
(such as `handlers_config.go` and `handlers_errors.go`), `service.go` plus
`service_*.go`, and `repository.go` plus `repository_*.go`. Put domain types
in `model.go`, shared interfaces in `interface.go`, and cache logic in
`cache.go`.

## Errors across layers

Translate errors at exactly two boundaries: the repository turns storage
errors into domain sentinels, and the handler turns domain sentinels into the
HTTP response. The service passes domain errors through, adding context with
`%w`, and translates only when it creates a new domain condition, such as a
soft delete becoming `ErrNotFound`. This keeps handlers independent of storage
drivers and keeps storage details in logs, not in client responses.

In the repository, wrap your own domain sentinels with `%w` so callers can
match them, and format raw storage errors with `%v` to cut the chain, so
callers can log the message but can't match driver types:

```go
if errors.Is(err, sql.ErrNoRows) {
	return fmt.Errorf("repository: config %s not found: %w", id, errorsx.ErrNotFound)
}
return fmt.Errorf("repository: failed to query config: %v", err)
```

## Observability

Add spans and metrics to handler, service, and repository methods only, not
to internal helpers, pure functions, or methods their caller already wraps,
such as a private `insertConfigInTx` inside a repository method that
`withDBMetrics` covers. Name spans `layer.Operation`, and record both a count
and a duration through typed metric fields. Create the tracer at package or
constructor level:

```go
var tracer = otel.Tracer("internal.contextx")
// or, in a constructor:
tracer: otel.Tracer("internal.routeconfig.handlers"),
```

## Handlers

A `Handlers` struct holds the logger, metrics, service, and tracer, built by
`NewHandlers`, with routes registered through `RegisterRoutes(mux, pipeline,
cfg)`. Write errors as RFC 7807 Problem Details:

```go
// RegisterRoutes mounts every handler behind the shared middleware pipeline,
// so no route skips auth, logging, or metrics.
func (h *Handlers) RegisterRoutes(mux *http.ServeMux, p *middleware.Pipeline, cfg *config.Config) {
	mux.Handle("POST /v1/things", p.Decorate(http.HandlerFunc(h.createThing)))
}

problem := errorsx.NewProblem("Not Found", "Resource not found.")
httpx.WriteJSON(ctx, logger, w, http.StatusNotFound, problem)
```

## Service

Service methods take `(ctx, In)` and return `(Out, error)`, where `In` and
`Out` are plain domain structs with no JSON, protobuf, or HTTP types. Put
input validation in a `Validate() error` method on `In`, and call it first
inside the span; handlers may also call it to fail fast. Wrap the operation in
a span and record metrics outside it:

```go
// Validate rejects input missing required fields, so every transport gets
// the same checks before any work starts.
func (in CreateConfigIn) Validate() error {
	if in.CustomerID == "" {
		return errorsx.Invalid("customer_id is required")
	}
	return nil
}

// CreateConfig validates and stores a new config, recording its outcome in
// traces and metrics so failures show up on dashboards.
func (s *Service) CreateConfig(ctx context.Context, in CreateConfigIn) (*Config, error) {
	start := time.Now()
	var cfg *Config
	err := traces.WithSpan(ctx, s.tracer, "service.CreateConfig", func(ctx context.Context) error {
		if err := in.Validate(); err != nil {
			return err
		}
		// ... business logic
		return nil
	})

	result := "success"
	if err != nil {
		result = "error"
	}
	s.metrics.configOpsTotal.WithLabelValues("create", result).Inc()
	s.metrics.serviceOpDuration.WithLabelValues("create_config", result).Observe(time.Since(start).Seconds())

	if err != nil {
		return nil, err
	}
	return cfg, nil
}
```

## Repository

Wrap every repository method in `withDBMetrics`, which adds the span and
records `dbOpsTotal` and `dbOpDuration` by operation, table, and result.
Transactions defer a rollback that logs and counts any rollback error other
than `sql.ErrTxDone`:

```go
// withDBMetrics wraps a repository operation with tracing and DB metrics, so
// every query is measured the same way without repeating the code.
func (r *MySQLRepository) withDBMetrics(ctx context.Context, span, operation, table string, fn func(ctx context.Context) error) error {
	start := time.Now()
	err := traces.WithSpan(ctx, r.Tracer, span, fn)

	result := resultSuccess
	if err != nil {
		result = resultError
	}
	r.Metric.dbOpsTotal.WithLabelValues(operation, table, result).Inc()
	r.Metric.dbOpDuration.WithLabelValues(operation, table, result).Observe(time.Since(start).Seconds())

	return err //nolint:wrapcheck // fn's errors are already wrapped
}

// CreateConfig inserts a config and its ownership row in one transaction, so
// a config never exists without an owner.
func (r *MySQLRepository) CreateConfig(ctx context.Context, config *Config) error {
	return r.withDBMetrics(ctx, "repository.CreateConfig", "insert", "routing_configs",
		func(ctx context.Context) error {
			tx, err := r.DB.BeginTx(ctx, nil)
			if err != nil {
				return fmt.Errorf("repository: failed to begin transaction: %w", err)
			}
			defer func() {
				if err = tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
					r.Logger.LogAttrs(ctx, slog.LevelError, "transaction_rollback",
						slog.String("operation", "create_config"),
						slog.String("config_id", config.ID),
						slog.Any("err", err))
					r.Metric.txErrors.WithLabelValues("create", "config").Inc()
				}
			}()

			if err := r.insertConfigInTx(ctx, tx, config); err != nil {
				return err
			}
			if err := r.insertConfigOwnershipInTx(ctx, tx, config); err != nil {
				return err
			}
			return tx.Commit()
		},
	)
}
```

## Middleware

A `Decorator` wraps an `http.Handler`, and a `Pipeline` composes them:

```go
// Decorator adds one cross-cutting behaviour to a handler, so concerns like
// auth and logging stay out of handler code.
type Decorator func(http.Handler) http.Handler

// Pipeline holds the middleware every route shares, so the chain is defined
// once.
type Pipeline struct {
	// middleware runs in slice order, first entry outermost.
	middleware []Decorator
}

// Decorate wraps next in the pipeline's middleware, applied in reverse so
// the first entry runs first.
func (p *Pipeline) Decorate(next http.Handler) http.Handler {
	for _, mw := range slices.Backward(p.middleware) {
		next = mw(next)
	}
	return next
}
```

## Caching

Cache read-heavy, stable data used across requests, such as routing configs
or feature flags, not request-scoped data, frequently changing data, or
results that are cheap to recompute. Use cache-aside through
`CacheManager.CacheOrFetch()`, deduplicate concurrent fetches with
`singleflight.Group`, and build hierarchical keys of the form
`prefix:customerID:resource:id`:

```go
key := cm.HierarchicalKeyFor(customerID, "config", configID)
```
