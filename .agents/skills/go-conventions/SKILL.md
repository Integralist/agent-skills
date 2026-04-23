---
name: go-conventions
description: >-
  Go coding conventions and style guide. Use whenever editing,
  reviewing, or creating Go files (*.go). Covers naming, error
  handling, testing, HTTP handlers, caching, concurrency, and
  observability.
---

We are peers writing Go. Prioritize correctness, clarity, and
best practices.

## Tooling

### Go LSP (gopls)

Prefer the gopls MCP server over `sed`, `grep`, or manual edits
for Go code navigation and refactoring. The LSP understands Go
semantics and will not miss references or corrupt similarly-named
identifiers the way text-based tools can.

Use these gopls tools:

- `go_workspace` — run first in a Go session.
- `go_vulncheck` — run right after `go_workspace`.
- `go_rename_symbol` — rename a type, function, variable, method,
  or field across the workspace. Prefer this over `sed` for any
  Go identifier rename.
- `go_symbol_references` — find every use of a symbol.
- `go_search` — fuzzy-find symbols.
- `go_file_context` — summarize intra-package dependencies after
  first reading a Go file.
- `go_package_api` — list a package's exported surface.
- `go_diagnostics` — compile errors and vet findings on changed
  files. Run after edits.

**Rename caveat:** `go_rename_symbol` rewrites Go references
only. It does not touch comments, godoc, `README.md`, or string
literals. After a rename, run `rg <old-name>` across the repo
and use `sed` or Edit to clean up the remaining occurrences.

### Linters

After editing Go files, run the following linters to catch
issues before committing:

- `go vet ./...`
- `go-critic check ./...` (if not installed:
  `go install -v github.com/go-critic/go-critic/cmd/go-critic@latest`)
- `staticcheck ./...` (if not installed:
  `go install honnef.co/go/tools/cmd/staticcheck@latest`)

Fix any reported issues before considering the task complete.

## Formatting

After editing Go files, run `gofumpt` to format all changed
files:

```bash
gofumpt -l -w .
```

If not installed: `go install mvdan.cc/gofumpt@latest`

## Structs

- Fields sorted alphabetically; embedded structs first.
- JSON tags on exported fields; `json:"-"` for internal-only
  fields.
- Pointer fields when nil means "not provided" (partial
  updates).

```go
type Service struct {
    cacheManager *CacheManager
    logger       *slog.Logger
    metrics      *metrics.Metrics
    repo         *MySQLRepository
    tracer       trace.Tracer
}
```

## Variables

Group consecutive `var` declarations into a single block:

```go
// Good
var (
    direction    string
    cursorValues []string
)

// Bad
var direction string
var cursorValues []string
```

## Abbreviations

Only: `ctx`, `err`, `req`, `resp`, `cfg`.

## Naming

Names must be unambiguous without type annotations. Apply the
**"delete the type" test**: if you removed the type from a
declaration, could a reader still tell what it refers to? If
not, the name is too generic.

### Struct names

Prefix with the domain or purpose when the bare name is
generic:

```go
// Bad — "Client" could be anything.
type Client struct { ... }

// Good — says what system it talks to.
type DNSClient struct { ... }
type VaultClient struct { ... }
type PurgeClient struct { ... }
```

### Field and variable names

Name by **role or target**, not by the Go type:

```go
// Bad
type PurgeService struct {
    client *http.Client
}

// Good
type PurgeService struct {
    purgeAPI *http.Client
}
```

### When generic names are acceptable

A generic name is fine when there is exactly one of that
concept in scope and the context makes it obvious:

```go
type Service struct {
    logger *slog.Logger
    repo   *MySQLRepository
    tracer trace.Tracer
}
```

If a second instance appears, rename **both** to be specific.

## Imports

Three groups separated by blank lines: stdlib, third-party,
internal.

```go
import (
    "context"
    "fmt"

    "go.opentelemetry.io/otel/trace"

    "github.com/fastly/blue-ribbon/internal/metrics"
)
```

## Error Handling

Choose the error form based on how callers need to react:

- **Sentinel errors** (`var ErrNotFound = ...`) — use when
  callers across package boundaries need `errors.Is` checks.
- **Wrapped errors** (`fmt.Errorf` with `%w`) — the default.
- **Custom error types** — use when callers need to extract
  structured data from the error.
- Classify errors for retry decisions (`errors.Is`,
  `errors.AsType`).

### Error message prefixes

Every wrapped error must start with a layer prefix:

```go
fmt.Errorf("handler: failed to decode request: %w", err)
fmt.Errorf("service: failed to create config: %w", err)
fmt.Errorf("repository: failed to begin transaction: %w", err)
```

The format is `"<layer>: <what failed>: %w"`.

### Error translation boundaries

Error translation happens at exactly two boundaries:

- **Repository**: storage errors → domain sentinels
- **Handler**: domain sentinels → HTTP/wire format

The service layer passes domain errors through unchanged
(adding context with `%w`). Do not translate in the service
layer unless it produces a new domain condition (e.g.,
soft-delete → `ErrNotFound`).

**Why this matters:**

- **Decoupling** — without translation, handlers import
  storage packages to check for `sql.ErrNoRows` etc. Domain
  sentinels let handlers depend only on business concepts.
- **Multi-transport consistency** — map domain errors to wire
  format once per transport (HTTP 404 / gRPC `codes.NotFound`).
- **Business logic gaps** — a soft-deleted record exists in
  the DB but the service treats it as missing. Only domain
  sentinels can express this.
- **Observability vs. client safety** — `%w` on domain errors
  lets handlers branch; `%v` on storage errors preserves the
  message for logs but hides internals from clients.
- **Idiomatic Go** — the stdlib uses the same pattern:
  `os.Open` translates `syscall.ENOENT` into `fs.ErrNotExist`.

### `%w` vs `%v` in the repository layer

Use `%w` only for **domain sentinel errors** callers should
inspect. Use `%v` for raw storage/driver errors to sever the
chain:

```go
// Domain error — wrap with %w
if errors.Is(err, sql.ErrNoRows) {
    return fmt.Errorf("repository: config %s not found: %w",
        id, errorsx.ErrNotFound)
}

// Raw storage error — sever with %v
return fmt.Errorf("repository: failed to query config: %v",
    err)
```

### Error type utilities

- Use `errors.AsType[T]` (Go 1.26+) instead of `errors.As`.
- Never panic; return errors.

## Constructors

NewX factories with dependency injection. Fields assigned
alphabetically.

When a constructor has more than 4 parameters, use a params
struct instead.

For types with required parameters plus optional configuration
with sensible defaults, use `WithXxx` method chaining.

### When to skip a constructor

If `NewX` only assigns parameters to fields with no defaults,
validation, or derived state, it is pointless indirection.
Instantiate the struct directly at the call site instead.

A constructor earns its keep when it does something the caller
cannot: setting defaults, validating inputs, deriving internal
state, providing access to unexported fields across public
package boundaries, or providing access to an unexported type.

## Interfaces

Define an interface when you need to swap implementations —
typically for testing or when multiple concrete backends exist.

- Define at consumer side, not provider.
- Place in `interface.go` when shared across packages.
- Compile-time compliance check:
  ```go
  var _ redis.Client = (*MockRedisClient)(nil)
  ```

## Logging

Log at layer boundaries and error paths — not inside every
function. Use `slog.LogAttrs`; snake_case event names.

```go
logger.LogAttrs(ctx, slog.LevelError, "create_config",
    slog.String("config_id", configID),
    slog.Any("err", err),
)
```

## Observability

Add trace spans and metrics at layer boundaries — handler,
service, and repository methods. Do not instrument internal
helpers.

```go
err := traces.WithSpan(ctx, s.tracer, "service.CreatePath",
    func(ctx context.Context) error {
        traces.AddAttributesToCurrentSpan(ctx,
            attribute.String("config_id", configID))
        return nil
    })
```

## Concurrency

Prefer `wg.Go` (Go 1.25+) over manual `wg.Add`/`go`/`wg.Done`:

```go
var wg sync.WaitGroup
wg.Go(func() { /* task */ })
wg.Go(func() { /* task */ })
wg.Wait()
```

## Context

- Only create derived contexts when you have a concrete reason
  (cancel goroutines, tighter deadlines).
- Prefer `*Cause` variants (`WithCancelCause`,
  `WithTimeoutCause`, `WithDeadlineCause`).
- Use context values for request-scoped metadata only.

## Testing

Table-driven tests with `testCases` slice and `t.Run`. Use
`testify/mock` for mock implementations. Build tag `e2e` for
integration tests.

## HTTP Handlers

Struct with logger, metrics, service. Factory `NewHandlers`.
Routes registered via `RegisterRoutes(mux, pipeline, cfg)`.
Errors as RFC 7807 Problem Details.

## Standard Library Preferences

Prefer newer stdlib packages over their older equivalents in
new code. When editing existing code that uses an older API
listed below, ask the user whether they want to migrate it to
the newer equivalent before proceeding.

### `net/netip` over `net` for IP types (Go 1.18+)

The `net/netip` package provides value-typed, comparable,
allocation-free replacements for the pointer-heavy types in
`net`:

| Old (`net`)  | New (`net/netip`) | Benefit                           |
| ------------ | ----------------- | --------------------------------- |
| `net.IP`     | `netip.Addr`      | Value type, comparable, no allocs |
| `net.IPNet`  | `netip.Prefix`    | Value type, comparable            |
| —            | `netip.AddrPort`  | IP+port as a single value type    |

```go
// Bad — pointer-based, not comparable.
var cidr *net.IPNet

// Good — value type, usable as map key.
var prefix netip.Prefix
```

Convert at boundaries when interacting with APIs that still
use `net` types:

```go
addr := netip.MustParseAddr("10.0.0.1")
stdIP := addr.AsSlice() // -> net.IP for legacy APIs

stdAddr, ok := netip.AddrFromSlice(legacyIP)
```

## Layer Separation

handlers -> service -> repository. Business logic in service,
data access in repository. Never skip layers.

## File Naming

- `handlers.go` + `handlers_*.go`
- `service.go` + `service_*.go`
- `repository.go` + `repository_*.go`
- `model.go` for domain types
- `interface.go` for shared interfaces
- `doc.go` for package-level comment
- `README.md` for every package
