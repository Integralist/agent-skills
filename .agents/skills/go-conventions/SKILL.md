---
name: go-conventions
description: >-
  MANDATORY for any work on Go files (*.go). Load this before editing,
  reviewing, or creating any *.go file. Go coding conventions and style
  guide covering naming, error handling, testing, HTTP handlers, caching,
  concurrency, and observability.
---

> [!NOTE]
> If you were invoked directly (e.g. `/go-conventions`) with no specific task,
> just read this skill so its conventions are loaded into context, then stop —
> there is nothing to do yet. They're now ready to apply when I ask you to
> design, write, or edit Go code.

We are peers writing Go. Prioritize correctness, clarity, and best practices.

## Tooling

### Go LSP (gopls)

Prefer the gopls MCP server over `sed`, `grep`, or manual edits for Go code
navigation and refactoring. The LSP understands Go semantics — package
qualifiers, method receivers, identifier shadowing — and will not miss
references or corrupt similarly-named identifiers the way text-based tools
can. Do not reach for `sed` to rename a Go symbol.

Use these gopls tools:

- `go_workspace` — run first in a Go session to detect the workspace
  layout.
- `go_vulncheck` — run immediately after `go_workspace` to surface known
  security risks.
- `go_rename_symbol` — rename a type, function, variable, method, or
  field across the entire workspace. Updates every Go reference,
  including qualified uses in other packages and import aliases. Always
  prefer this over `sed` for an identifier rename.
- `go_symbol_references` — locate every use of a symbol. Run before
  deleting or changing the signature of anything exported.
- `go_search` — fuzzy-find a symbol when the exact name or location is
  unknown.
- `go_file_context` — summarize the intra-package declarations a file
  depends on. Use after reading a Go file for the first time.
- `go_package_api` — list the exported surface of a package.
- `go_diagnostics` — compile errors and vet findings on changed files.
  Run after edits.

#### Rename caveat: comments and docs

`go_rename_symbol` rewrites Go references only. It does **not** touch
code comments, godoc blocks, `README.md`, other markdown, or string
literals — these keep the old name and become stale pointers.

After an LSP rename:

1. Run `rg <old-name>` across the repository to surface remaining
   occurrences in comments, docs, and strings.
1. Use `sed` or targeted Edit calls to update the remaining
   occurrences.

This is the one place `sed` is the right tool for a Go rename — not on
source code, but on the non-source text the LSP leaves behind.

### Linters

After editing Go files, run the following linters to catch issues before
committing:

- `go vet ./...`
- `go-critic check ./...` (if not installed:
  `go install -v github.com/go-critic/go-critic/cmd/go-critic@latest`)
- `staticcheck ./...` (if not installed:
  `go install honnef.co/go/tools/cmd/staticcheck@latest`)

Fix any reported issues before considering the task complete.

### Suppressing linter warnings

Prefer fixing the underlying issue. When a suppression is
genuinely warranted, see
[`LINTER-DIRECTIVES.md`](LINTER-DIRECTIVES.md) for the exact
directive syntax each tool expects.

### Reference sources

When uncertain about Go behavior, pick the source that matches the question:

- **Language semantics** (operator precedence, conversion rules, `range`
  semantics, method-set rules, type identity, addressability) — the Go
  specification at https://go.dev/ref/spec.
- **Standard library API surface and behavior** — `go doc <pkg>[.Symbol]` or
  pkg.go.dev. Faster and more accurate than the spec for stdlib questions.
- **Version availability** (e.g. "does `wg.Go` exist?", "when was
  `errors.AsType` added?") — Go release notes at
  https://go.dev/doc/devel/release.
- **Tooling, modules, build behavior** — https://go.dev/ref/mod and the
  relevant command's `go help` output.

Do not guess from training data — cite the source.

### Looking up a package's public API

To see a package's exported API (types, funcs, methods, consts, or one
symbol's signature and doc), run `go doc` — don't grep or read source files
first. It's faster, returns exactly the exported surface with doc comments, and
resolves the version the build uses (module cache, `replace` directives,
vendor).

For a whole package's surface when it's in your workspace, prefer the gopls
`go_package_api` tool (warm, in-memory). Reach for `go doc` for symbol-level
detail, doc comments, source (`-src`), commands (`-cmd`), or a dependency gopls
doesn't have loaded.

- `go doc <path>` — whole package (e.g. `go doc net/http`).
- `go doc <path>.<Symbol>` — one symbol; a type includes its fields and method
  signatures (e.g. `go doc net/http.Client`).
- `go doc <path>.<Type>.<Method>` — one method or field.
- `-short` — one line per symbol; fastest way to scan a surface.
- `-all` — full documented surface; `-src` — a symbol's source; `-u` — include
  unexported identifiers.
- `-cmd` — required for a `package main`, whose exported symbols are otherwise
  elided.
- `-C <dir>` (must come first) — run as if from `<dir>`, to doc a module's
  dependency without a separate `cd`.

`go doc` documents the version the current module resolves — there is no
`path@version` syntax. To read a different version, change what the module
resolves (`go get <mod>@<ver>` or edit go.mod), then re-run; confirm with
`go list -m <mod>`. Common errors:

- `missing go.sum entry` — dep is in go.mod but not downloaded; run
  `go mod download <mod>`.
- `no required module provides package` — not a dependency; run `go get <path>`
  first (`go doc` won't fetch it).
- Third-party packages need a surrounding module, so run from inside the repo;
  the stdlib works anywhere.

Fall back to reading source (via the gopls tools, then `Read`) only when
`go doc` is insufficient — an unexported detail, behavior not in the doc, or a
symbol it can't find. When you do need a symbol's source, `go doc -src <path>.<Symbol>` usually beats a manual grep + read.

## Formatting

After editing Go files, run `gofumpt` to format all changed files:

```bash
gofumpt -l -w .
```

If not installed: `go install mvdan.cc/gofumpt@latest`

Then run `goimports-reviser` to organize and group imports:

```bash
goimports-reviser -company-prefixes github.com/fastly -project-name $(shell go list -m) ./...
```

If not installed: `go install github.com/incu6us/goimports-reviser/v3`

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

Names must be unambiguous without type annotations. Apply the **"delete the
type" test**: if you removed the type from a declaration, could a reader still
tell what it refers to? If not, the name is too generic.

### Struct names

Prefix with the domain or purpose when the bare name is generic. A package
may contain multiple things that could be called "Client" or "Store" — the
name must distinguish which one:

```go
// Bad — "Client" could be anything.
type Client struct { ... }

// Good — says what system it talks to.
type DNSClient struct { ... }
type VaultClient struct { ... }
type PurgeClient struct { ... }
```

The exception is when the package itself already narrows the scope
unambiguously (e.g., a `redis` package exporting `redis.Client` is clear).

### Field and variable names

Name by **role or target**, not by the Go type. When a struct holds a
dependency, the field name should say what it connects to or what it does:

```go
// Bad — "client" mirrors the type, ambiguous if more are added.
type PurgeService struct {
	client *http.Client
}

// Good — says what the HTTP client is for.
type PurgeService struct {
	purgeAPI *http.Client
}

// Good — distinguishes when multiple clients exist.
type Service struct {
	dnsAPI   *http.Client
	purgeAPI *http.Client
	storage  ObjectStore
}
```

The same applies to local variables:

```go
// Bad — two "client" variables distinguished only by type.
client := newDNSClient()
client2 := newPurgeClient()

// Good — each name stands alone.
dnsClient := newDNSClient()
purgeClient := newPurgeClient()
```

### When generic names are acceptable

A generic name is fine when there is exactly one of that concept in scope
and the context makes it obvious:

```go
// Fine — only one logger, one tracer, one repo in this struct.
type Service struct {
	logger *slog.Logger
	repo   *MySQLRepository
	tracer trace.Tracer
}
```

If a second instance of the same concept appears, rename **both** to be
specific — don't leave one generic and suffix the other:

```go
// Bad — asymmetric, implies "repo" is the "real" one.
type Service struct {
	repo       *MySQLRepository
	legacyRepo *PostgresRepository
}

// Good — both names explain what they hold.
type Service struct {
	configRepo *MySQLRepository
	auditRepo  *PostgresRepository
}
```

### Default-value constants

Constants that hold a default value start with the `default` prefix, followed
by the noun they describe. The qualifier `default` leads; it does not sit in
the middle of the name:

```go
// Bad — "default" buried in the middle.
const debugDefaultPort = 8080
const portDefault = 8080

// Good — "default" leads, noun follows.
const defaultDebugPort = 8080
const defaultTimeout = 30 * time.Second
```

This reads as "the default debug port" and groups all defaults together
alphabetically and in autocomplete.

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

## Comments

The "default to no comments" guidance is about *writing* new comments, not
*removing* existing ones. Assume every inherited comment was placed
deliberately until you can prove otherwise.

### Always preserve

- **Function-level doc comments** — the sentence(s) above a type,
  function, method, var, or const describing what it does at a high
  level. Keep these on unexported identifiers too, not just exported
  ones. On exported identifiers they also form the package's godoc.
- **Marker comments** — `// TODO:`, `// FIXME:`, `// NOTE:`, `// HACK:`,
  `// XXX:`. They flag unresolved work or hidden context the author
  wanted a future reader to see.
- **Directive comments** — `//go:build`, `//go:embed`, `//go:generate`,
  `// Deprecated:`, `//nolint:...`. These are machine-read; removing
  them changes build or tool behavior.
- **WHY comments** — explanations of a hidden constraint, a workaround
  for a specific bug, a non-obvious invariant, or behavior that would
  surprise a reader.

### Safe to remove

- Comments that restate the name of the identifier immediately below
  them (e.g., `// Create metrics server` above `createMetricsServer()`).
- Stale comments describing code that no longer exists.
- Commented-out code left behind from a previous change.

### Before removing any comment

When an edit would delete one or more comments, first list each one
with a one-line reason for removal, then make the edit. For example:

```txt
- handler.go:42  `// TODO: retry on 503` — keep (marker comment)
- handler.go:58  `// create the client` — remove (restates name)
- handler.go:71  `// NOTE: must run before auth` — keep (WHY)
```

This forces you to classify each comment against the rules above
rather than sweeping them all out together. If you cannot articulate
why a comment is redundant, keep it.

## Error Handling

Choose the error form based on how callers need to react:

- **Sentinel errors** (`var ErrNotFound = ...`) — use when callers across
  package boundaries need `errors.Is` checks to branch on the error. Don't
  create sentinels for errors that only propagate up without inspection.
  ```go
  var ErrNotFound = errors.New("not found")
  ```
- **Wrapped errors** (`fmt.Errorf` with `%w`) — the default for most errors.
  Adds context while preserving the chain.
- **Custom error types** — use when callers need to extract structured data
  from the error (e.g., HTTP status code, retry-after duration). Must
  implement `Error()` and `Unwrap()`.
- Classify errors for retry decisions (`errors.Is`, `errors.AsType`).

### Error message prefixes

Every wrapped error must start with a layer prefix so the origin is
immediately obvious in logs. The prefix is the package or logical layer name,
not the function name:

```go
// handler layer
fmt.Errorf("handler: failed to decode request: %w", err)

// service layer
fmt.Errorf("service: failed to create config: %w", err)

// repository layer
fmt.Errorf("repository: failed to begin transaction: %w", err)

// other packages use their package name
fmt.Errorf("redis: transient error: %w", err)
fmt.Errorf("cache: failed to marshal result: %w", err)
fmt.Errorf("middleware: authentication failed: %w", err)
```

The format is `"<layer>: <what failed>: %w"`. Omit the package/type name
that is already implied by the prefix (e.g., `"redis: failed to ping: %w"`
not `"redis: failed to ping redis: %w"`).

### Error translation boundaries

Error translation happens at exactly two boundaries:

- **Repository**: storage errors → domain sentinels
- **Handler**: domain sentinels → HTTP/wire format

The service layer passes domain errors through unchanged (adding context
with `%w`). Do not translate errors in the service layer unless the
service itself produces a new domain condition (e.g., soft-delete →
`ErrNotFound`).

**Why this matters:**

- **Decoupling** — without translation, handlers import storage packages
  (`database/sql`, `redis`) to check for errors like `sql.ErrNoRows`.
  Adding a cache layer or swapping databases forces changes in every
  handler. Domain sentinels let handlers depend only on business concepts.
- **Multi-transport consistency** — a service serving both HTTP and gRPC
  maps domain errors to wire format once per transport (`ErrNotFound` →
  404 or `codes.NotFound`), avoiding duplicated storage checks.
- **Business logic gaps** — storage errors can't capture domain nuances.
  A soft-deleted record exists in the database (no `sql.ErrNoRows`), but
  the service treats it as missing. Only domain sentinels can express this.
- **Observability vs. client safety** — `%w` on domain errors lets
  handlers branch; `%v` on storage errors preserves the message for logs
  but hides internals from clients. The client sees "not found"; the
  on-call engineer sees "user 42 soft-deleted: not found".
- **Idiomatic Go** — the standard library uses the same pattern: `os.Open`
  translates platform-specific errors (`syscall.ENOENT`,
  `ERROR_FILE_NOT_FOUND`) into the portable `fs.ErrNotExist`.

### `%w` vs `%v` in the repository layer

In the repository layer, use `%w` only when wrapping **domain sentinel
errors** that callers should inspect with `errors.Is`. Use `%v` for raw
storage/driver errors to sever the chain — callers get the message for
logging but cannot match against storage-specific types:

```go
// Translated to domain error — wrap with %w (callers inspect this)
if errors.Is(err, sql.ErrNoRows) {
	return fmt.Errorf("repository: config %s not found: %w", id, errorsx.ErrNotFound)
}

// Raw storage error — sever with %v (callers should not inspect this)
return fmt.Errorf("repository: failed to query config: %v", err)
```

The rule: `%w` for your own domain errors, `%v` for storage errors.

### Error type utilities

- Use `errors.AsType[T]` (Go 1.26+) instead of `errors.As`. It returns
  `(T, bool)` and avoids the need for a pre-declared target variable:
  ```go
  if dnsErr, ok := errors.AsType[*net.DNSError](err); ok {
      // use dnsErr
  }
  ```
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

When a constructor has more than 4 parameters, use a params struct instead
(`ctx` counts toward the total):

```go
type ServiceParams struct {
	Logger  *slog.Logger
	Metrics *metrics.Metrics
	Repo    *MySQLRepository
	Tracer  trace.Tracer
}

func NewService(p ServiceParams) *Service {
	return &Service{
		logger:  p.Logger,
		metrics: p.Metrics,
		repo:    p.Repo,
		tracer:  p.Tracer,
	}
}
```

For types with required parameters plus optional configuration with sensible
defaults, use `WithXxx` method chaining. `NewX` takes only required params;
`WithXxx` methods set optional fields and return the receiver:

```go
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: http.DefaultClient,
		timeout:    30 * time.Second,
	}
}

func (c *Client) WithHTTPClient(h *http.Client) *Client {
	c.httpClient = h
	return c
}

func (c *Client) WithTimeout(d time.Duration) *Client {
	c.timeout = d
	return c
}
```

### When to skip a constructor

If `NewX` only assigns parameters to fields with no defaults, validation, or
derived state, it is pointless indirection. Instantiate the struct directly at
the call site instead:

```go
// Bad — constructor adds nothing (same-package caller).
func NewRepository(db mysqlwrapper.Querier, r *redis.Client, l *slog.Logger, m *Metrics, tracer trace.Tracer) *MySQLRepository {
	return &MySQLRepository{
		db:     db,
		logger: l,
		metric: m,
		redis:  r,
		tracer: tracer,
	}
}

// Good — direct instantiation (same-package caller).
r := &MySQLRepository{
	db:     db,
	logger: logger,
	metric: metrics,
	redis:  redisClient,
	tracer: tracer,
}
```

**Cross-package boundary exceptions**: direct instantiation from another package
requires both an exported struct name *and* exported fields. Two cases force a
constructor:

- **Unexported fields** — exporting them to dodge the constructor leaks internal
  state. For `internal/` packages this is acceptable (no public API risk), so
  consider exporting fields and inlining instead.
- **Unexported struct** — when the struct is intentionally unexported (e.g.,
  `authzService` backing an `AuthzService` interface), external callers cannot
  name the type at all. A constructor is structurally required.

```go
// Justified — unexported struct, cross-package callers cannot name the type.
func NewAuthzService(repo *MySQLRepository, logger *slog.Logger) AuthzService {
	return &authzService{
		logger: logger,
		repo:   repo,
	}
}
```

A constructor earns its keep when it does something the caller
cannot: setting defaults, validating inputs, deriving internal
state, or providing access to unexported fields/types across
package boundaries.

Tracer initialization at package or constructor level:

```go
var tracer = otel.Tracer("internal.contextx")
// or
tracer: otel.Tracer("internal.routeconfig.handlers"),
```

## Interfaces

Define an interface when you need to swap implementations — typically for
testing (mocks) or when multiple concrete backends exist. Do not introduce an
interface to abstract a single concrete type that has no reason to vary.

- Define at consumer side, not provider.
- Place in `interface.go` when shared across packages.
- Compile-time compliance check:
  ```go
  var _ redis.Client = (*MockRedisClient)(nil)
  ```

## Logging

Log at layer boundaries (handlers, service, repository) and error paths — not
inside every function. Don't log what a caller already logs; if a service method
logs an error before returning it, the handler should not log it again.

Use `slog.LogAttrs`; same event name for success and error (level
distinguishes).

Use snake_case for the identifiers you author:

- **The event name** — the `msg` argument value (our handler renames this field
  to `event`), e.g. `"create_config"`.
- **Attribute keys** — e.g. `"config_id"`, `"ttl"`.

This does **not** apply to attribute *values* — those are data (opaque IDs,
names, free-form text) and keep whatever form they arrive in.

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

### Discarding logs

To silence a logger (e.g. in tests), use `slog.DiscardHandler` (Go 1.24+)
rather than wrapping `io.Discard` in a text or JSON handler. It's a true no-op
— it skips attribute formatting entirely, so it's cheaper and clearer of
intent. Note it's a value, not a constructor — no parentheses:

```go
// Bad — formats attributes only to throw the bytes away.
logger := slog.New(slog.NewTextHandler(io.Discard, nil))

// Good — no-op handler, no formatting work.
logger := slog.New(slog.DiscardHandler)
```

## Observability

Add trace spans and metrics at layer boundaries — handler, service, and
repository methods. Do not instrument internal helpers, pure functions, or
methods that are already wrapped by their caller (e.g., a private
`insertConfigInTx` called inside a repository method that already has a span
via `withDBMetrics`).

Wrap operations with trace spans using `layer.Operation` naming:

```go
err := traces.WithSpan(ctx, s.tracer, "service.CreatePath", func(ctx context.Context) error {
	traces.AddAttributesToCurrentSpan(ctx, attribute.String("config_id", configID))
	// ... operation
})
```

Record both count and duration metrics via typed struct fields:

```go
s.metrics.pathOpsTotal.WithLabelValues("create", result).Inc()
s.metrics.serviceOpDuration.WithLabelValues("create_path", result).Observe(time.Since(start).Seconds())
```

## Concurrency

Use goroutines for independent I/O-bound work where parallelism reduces
latency (e.g., fanning out to multiple services). Do not parallelize
CPU-bound sequential logic, operations that are already fast, or work with
ordering dependencies.

Prefer `wg.Go` (Go 1.25+) over manual `wg.Add`/`go`/`wg.Done`:

```go
var wg sync.WaitGroup
wg.Go(func() { /* task */ })
wg.Go(func() { /* task */ })
wg.Wait()
```

`wg.Go` handles Add/Done internally; the func must not panic.

## Context Cancellation

Parent cancellation propagates automatically — only create a derived context
when you have a concrete reason:

- **`WithCancelCause`** — you spawn goroutines or fan-out work that must be
  cancelled independently of the parent (e.g., cancel remaining goroutines on
  first error).
- **`WithTimeoutCause` / `WithDeadlineCause`** — you need a tighter deadline
  than the parent provides (e.g., an RPC call that should fail faster than the
  overall request).

Do **not** wrap with `WithCancelCause` when you are simply passing context
through a call chain — the parent's cancellation already reaches every child.

When you do create a derived context, prefer the `*Cause` variants so every
cancellation carries a reason:

- `context.WithCancelCause` instead of `context.WithCancel`
- `context.WithTimeoutCause` instead of `context.WithTimeout`
- `context.WithDeadlineCause` instead of `context.WithDeadline`
- `context.AfterFunc` callbacks should pass causes via `context.Cause(ctx)`

```go
ctx, cancel := context.WithTimeoutCause(ctx, 5*time.Second, errors.New("service: timed out fetching config"))
defer cancel()
```

Retrieve the cause with `context.Cause(ctx)` rather than checking `ctx.Err()`
alone.

## Context Values

Use context values for request-scoped metadata that crosses API boundaries
(request ID, customer ID, auth claims). Do not use context values to pass
function arguments or application configuration — those belong in function
signatures or struct fields.

Unexported struct keys; generic `WithValue`/`FromContext` helpers instead of
per-type wrappers.

Define the generic helpers once in a `contextx` (or similar) package:

```go
// WithValue sets a typed value into the context under the given key.
func WithValue[T any](ctx context.Context, key any, val T) context.Context {
	return context.WithValue(ctx, key, val)
}

// FromContext retrieves a typed value from the context.
func FromContext[T any](ctx context.Context, key any) (T, bool) {
	if v, ok := ctx.Value(key).(T); ok {
		return v, true
	}
	var zero T
	return zero, false
}
```

Each context key is still an unexported struct type with an exported variable:

```go
type customerIDCtxKey struct{}

var CustomerIDContextKey = customerIDCtxKey{}
```

Usage:

```go
ctx = contextx.WithValue(ctx, CustomerIDContextKey, "cust-123")
id, ok := contextx.FromContext[string](ctx, CustomerIDContextKey)
```

## Testing

> [!IMPORTANT]
> Before writing, editing, or reviewing any `*_test.go` file — or test
> helpers, mocks, fuzz tests, or benchmarks — load the
> [`go-testing`](../go-testing/SKILL.md) skill for the full templates
> (table-driven, f-tests, HTTP handlers, mocks, fuzz, benchmarks). The
> rules below are the linter and naming constraints that bind whatever
> you write; `go-testing` is the structure.

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
- Use `httptest.NewRequestWithContext` instead of `httptest.NewRequest` to
  satisfy the `noctx` linter:
  ```go
  // Bad — noctx warns.
  req := httptest.NewRequest(http.MethodGet, "/path", nil)

  // Good — context is explicit.
  req := httptest.NewRequestWithContext(ctx, http.MethodGet, "/path", nil)
  ```
- Similarly, use `http.NewRequestWithContext` instead of `http.NewRequest` in
  production code:
  ```go
  // Bad — noctx warns.
  req, err := http.NewRequest(http.MethodGet, url, body)

  // Good — context is explicit.
  req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, body)
  ```
- Narrow variable scope to satisfy the `scopeguard` linter. When a variable is
  only used inside an `if` block, fold the assignment into the `if` init
  statement:
  ```go
  // Good — result scoped to the if block.
  if result := cm.extractCustomerID(tt.cacheKey); result != tt.expected {
      t.Errorf("extractCustomerID(%q) = %q, expected %q", tt.cacheKey, result, tt.expected)
  }
  ```
  When folding into an `if` init statement would hurt readability (e.g. multiple
  short assignments that compare against each other), suppress with
  `//nolint:scopeguard` instead:
  ```go
  result := cm.customerKeySetName("customer123") //nolint:scopeguard
  expected := "br:customer123:_keys"             //nolint:scopeguard
  if result != expected {
      t.Errorf("customerKeySetName(%q) = %q, expected %q", "customer123", result, expected)
  }
  ```

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

- Service methods take `(ctx, In)` and return `(Out, error)` where `In` and
  `Out` are plain domain structs with no transport-specific tags (no `json:`,
  no protobuf, no HTTP types). This keeps the service reusable across
  transports and test harnesses, and makes the signature uniform so future
  adapters (e.g. a second transport) can wrap every method the same way.
- Put input validation on the input struct as a `Validate() error` method,
  not inline in the service method body. The service calls `in.Validate()`
  as the first step inside the trace span. Handlers may also invoke it
  between decode and the service call to fail fast on wire-level errors.
  ```go
  type CreateConfigIn struct {
      CustomerID string
      Name       string
  }

  func (in CreateConfigIn) Validate() error {
      if in.CustomerID == "" {
          return errorsx.Invalid("customer_id is required")
      }
      return nil
  }
  ```
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
	s.metrics.thingOpsTotal.WithLabelValues("create", result).Inc()
	s.metrics.serviceOpDuration.WithLabelValues("create_thing", result).Observe(time.Since(start).Seconds())

	if err != nil {
		return nil, err
	}
	return thing, nil
}
```

## Repository Layer

Wrap every repository method with `withDBMetrics` to get tracing, count, and
duration metrics for free. The helper times the operation, records `dbOpsTotal`
and `dbOpDuration` with operation/table/result labels, and derives the result
from the returned error:

```go
// withDBMetrics wraps a repository operation with tracing and DB metrics.
func (r *MySQLRepository) withDBMetrics(ctx context.Context, span, operation, table string, fn func(ctx context.Context) error) error {
	start := time.Now()
	err := traces.WithSpan(ctx, r.Tracer, span, fn)

	result := resultSuccess
	if err != nil {
		result = resultError
	}
	r.Metric.dbOpsTotal.WithLabelValues(operation, table, result).Inc()
	r.Metric.dbOpDuration.WithLabelValues(operation, table, result).Observe(time.Since(start).Seconds())

	return err //nolint:wrapcheck
}
```

Repository methods pass a closure to `withDBMetrics`. Transactions use deferred
rollback with rollback-error metrics:

```go
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

Cache read-heavy, stable data that is accessed across multiple requests (e.g.,
routing configs, feature flags). Do not cache request-scoped data,
frequently-mutated data, or results that are cheap to recompute.

Cache-aside with `CacheManager.CacheOrFetch()`. Use `singleflight.Group` to
deduplicate concurrent fetches. Hierarchical keys:
`prefix:customerID:resource:id`.

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
- `README.md` for every package (see below)

### Package `doc.go`

Every Go package must have a `doc.go` file containing only the package-level
comment and the `package` declaration. When creating a new package, add one.
When editing a file in an existing package, check for a missing `doc.go` and
add one if absent. If the package's purpose has changed, update the comment.

```go
// Package redis provides a thin wrapper around go-redis with
// connection pooling, health checks, and structured logging.
package redis
```

Keep the comment to one or two sentences describing what the package does
and why it exists. Do not put imports, constants, or code in `doc.go`.

### Package README

Every Go package must have a `README.md` in its directory. When creating a
new package, add one. When editing a file in an existing package, check for
a missing `README.md` and add one if absent.

Contents — keep it short and factual:

1. **Purpose** — one or two sentences on what the package does and why it
   exists.
1. **Responsibilities** — bullet list of what this package owns.
1. **Usage** — a brief code snippet showing the primary entry point or
   typical call pattern.

Do not duplicate godoc. The README orients a reader who is browsing the
directory tree; godoc covers the API surface.

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

## Standard Library Preferences

Prefer newer stdlib packages over their older equivalents in new
code. When editing existing code that uses an older API, ask the
user whether they want to migrate. See
[`STDLIB-PREFERENCES.md`](STDLIB-PREFERENCES.md) for the full
reference tables.

## Layer Separation

handlers -> service -> repository. Business logic in service, data access in repository. Never skip layers.
