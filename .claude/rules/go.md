---
paths:
  - '**/*.go'
---

We are peers writing Go. Prioritize correctness, clarity, and best practices.

## Tooling

- Run `go vet ./...`
- Run `go-critic check ./...` (if not installed: `go install -v github.com/go-critic/go-critic/cmd/go-critic@latest`)
- Run `gofumpt -l -w .` (if not installed: `go install mvdan.cc/gofumpt@latest`)
- Run `staticcheck ./...` (if not installed: `go install honnef.co/go/tools/cmd/staticcheck@latest`)

## Structs

- Fields sorted alphabetically; embedded structs first.
- JSON tags on exported fields; `json:"-"` for internal-only fields.
- Pointer fields when nil means "not provided" (partial updates).

```go
type Service struct {
	cacheManager *CacheManager
	logger       *slog.Logger
	metrics      *metrics.Metrics
	repo         *MySQLRepository
	tracer       trace.Tracer
}
```

## Abbreviations

Only: `ctx`, `err`, `req`, `resp`, `cfg`.

## Imports

Three groups separated by blank lines: stdlib, third-party, internal.

```go
import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel/trace"

	"github.com/fastly/blue-ribbon/internal/metrics"
)
```

## Error Handling

- Sentinel errors as package-level `var`:
  ```go
  var ErrNotFound = errors.New("not found")
  ```
- Wrap with layer prefix:
  ```go
  return nil, fmt.Errorf("service: failed to create config: %w", err)
  ```
- Custom error types implement `Error()` and `Unwrap()`.
- Classify errors for retry decisions (`errors.Is`, `errors.As`).
- Never panic; return errors.

## Constructors

NewX factories with dependency injection. Fields assigned alphabetically.

```go
func NewService(repo *MySQLRepository, tracer trace.Tracer, logger *slog.Logger) *Service {
	return &Service{
		logger: logger,
		repo:   repo,
		tracer: tracer,
	}
}
```

Tracer initialization at package or constructor level:

```go
var tracer = otel.Tracer("internal.contextx")
// or
tracer: otel.Tracer("internal.routeconfig.handlers"),
```

## Interfaces

- Define at consumer side, not provider.
- Place in `interface.go` when shared across packages.
- Compile-time compliance check:
  ```go
  var _ redis.Client = (*MockRedisClient)(nil)
  ```

## Logging

Use `slog.LogAttrs`; snake_case event names; same event name for success and error (level distinguishes).

```go
logger.LogAttrs(ctx, slog.LevelError, "create_config",
	slog.String("config_id", configID),
	slog.Any("err", err),
)
```

Group related attributes:

```go
slog.Group("redis",
	slog.String("key", key),
	slog.Duration("ttl", ttl),
)
```

## Observability

Wrap operations with trace spans using `layer.Operation` naming:

```go
err := traces.WithSpan(ctx, s.tracer, "service.CreatePath", func(ctx context.Context) error {
	traces.AddAttributesToCurrentSpan(ctx, attribute.String("config_id", configID))
	// ... operation
})
```

Record both count and duration metrics:

```go
s.metrics.Count(ctx, "path_operations_total", "operation=create", "result="+result)
s.metrics.Measure(ctx, "service_operation_duration_seconds", time.Since(start).Seconds(), "operation=create_path", "result="+result)
```

## Context

Unexported struct keys; exported `WithXxx`/`XxxFromContext` helpers.

```go
type customerIDCtxKey struct{}

var CustomerIDContextKey = customerIDCtxKey{}

func WithCustomerID(ctx context.Context, customerID string) context.Context {
	return context.WithValue(ctx, CustomerIDContextKey, customerID)
}

func CustomerIDFromContext(ctx context.Context) (string, bool) {
	if v := ctx.Value(CustomerIDContextKey); v != nil {
		if s, ok := v.(string); ok {
			return s, ok
		}
	}
	return "", false
}
```

## Testing

Table-driven tests with `testCases` slice and `t.Run`:

```go
testCases := []struct {
	name    string
	input   string
	isValid bool
}{
	{"Valid input", "good", true},
	{"Empty input", "", false},
}

for _, tc := range testCases {
	t.Run(tc.name, func(t *testing.T) {
		// ...
	})
}
```

- Use `testify/mock` for mock implementations.
- Build tag `e2e` for integration tests; unit tests have no build tags.
- Compile-time interface compliance in test utility packages.
- Always add code comments above the test function to explain what it validates.

## HTTP Handlers

Struct with logger, metrics, service. Factory `NewHandlers`. Routes registered via `RegisterRoutes(mux, pipeline, cfg)`.

```go
type Handlers struct {
	logger  *slog.Logger
	metrics *metrics.Metrics
	service *Service
	tracer  trace.Tracer
}

func (h *Handlers) RegisterRoutes(mux *http.ServeMux, p *middleware.Pipeline, cfg *config.Config) {
	mux.Handle("POST /v1/things", p.Decorate(http.HandlerFunc(h.createThing)))
}
```

Errors as RFC 7807 Problem Details:

```go
problem := errorsx.NewProblem("Not Found", "Resource not found.")
httpx.WriteJSON(ctx, logger, w, http.StatusNotFound, problem)
```

## Service Layer

- Trace-wrap the operation; metrics outside the span.
- Validate at service boundary; return validation errors.

```go
func (s *Service) CreateThing(ctx context.Context, params ServiceParams) (*Thing, error) {
	start := time.Now()
	var (
		thing *Thing
		err   error
	)
	spanFunc := func(ctx context.Context) error {
		// ... business logic
		return nil
	}
	err = traces.WithSpan(ctx, s.tracer, "service.CreateThing", spanFunc)

	result := "success"
	if err != nil {
		result = "error"
	}
	s.metrics.Count(ctx, "thing_operations_total", "operation=create", "result="+result)
	s.metrics.Measure(ctx, "service_operation_duration_seconds", time.Since(start).Seconds(), "operation=create_thing", "result="+result)

	if err != nil {
		return nil, err
	}
	return thing, nil
}
```

## Repository Layer

Transaction with deferred rollback; traced queries; metrics on duration.

```go
spanFunc := func(ctx context.Context) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("repository: failed to begin transaction: %w", err)
	}
	defer func() {
		if err = tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
			r.logger.LogAttrs(ctx, slog.LevelError, "transaction_rollback",
				slog.String("operation", "create_thing"),
				slog.Any("err", err))
		}
	}()

	// ... queries
	return tx.Commit()
}
err := traces.WithSpan(ctx, r.tracer, "repository.CreateThing", spanFunc)
```

## Middleware

`Decorator` type wrapping `http.Handler`. `Pipeline` for composition.

```go
type Decorator func(http.Handler) http.Handler

type Pipeline struct {
	middleware []Decorator
}

func (p *Pipeline) Decorate(next http.Handler) http.Handler {
	for _, mw := range slices.Backward(p.middleware) {
		next = mw(next)
	}
	return next
}
```

## Caching

Cache-aside with `CacheManager.CacheOrFetch()`. Use `singleflight.Group` to deduplicate concurrent fetches. Hierarchical keys: `prefix:customerID:resource:id`.

```go
key := cm.HierarchicalKeyFor(customerID, "config", configID)
```

## File Naming

- `handlers.go` + `handlers_*.go` (by resource: `handlers_config.go`, `handlers_errors.go`)
- `service.go` + `service_*.go`
- `repository.go` + `repository_*.go`
- `model.go` for domain types
- `interface.go` for shared interfaces
- `cache.go` for cache logic

## Type Definitions

String enums with `All*` validation slice:

```go
type ConditionType string

const (
	HeaderCondition ConditionType = "header"
	GeoCondition    ConditionType = "geo"
)

var AllConditionTypes = []ConditionType{HeaderCondition, GeoCondition}
```

## Layer Separation

handlers -> service -> repository. Business logic in service, data access in repository. Never skip layers.
