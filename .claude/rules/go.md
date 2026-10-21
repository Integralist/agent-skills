---
paths:
  - '**/*.go'
---

> [!NOTE]
> If you were invoked directly (e.g. `/conventions-go`) with no specific task,
> just read this skill so its conventions are loaded into context, then stop —
> there is nothing to do yet. They're now ready to apply when I ask you to
> design, write, or edit Go code.

# Go Conventions

Write Go that follows these conventions, and run the tools below after every
edit. Everything here applies to all Go, including CLIs and libraries. An
HTTP/API service built as handlers → service → repository also follows
[SERVICE-ARCHITECTURE.md](../skills/conventions-go/references/SERVICE-ARCHITECTURE.md);
don't add that layering to other kinds of program. In a repo that already has
a different architecture, follow it rather than this one.

**Go version.** If `go.mod` exists, match its `go` directive before using
versioned language or standard-library APIs, unless the task includes an
upgrade.

**Standard library.** In new code, prefer newer standard-library APIs over
older ones (`net/netip` over `net` IP types) and named constants over magic
literals (`http.MethodGet`, `http.StatusOK`). When editing code that uses an
older API, ask before migrating it.
[STDLIB-PREFERENCES.md](STDLIB-PREFERENCES.md) has the full tables.

## Tooling

**gopls.** Navigate and refactor with gopls rather than text search or `sed`,
because it understands symbols and avoids false matches. Start a Go session
with `go_workspace`, then `go_vulncheck`. Rename with `go_rename_symbol`, then
run `rg <old-name>` to fix the comments, docs, and strings it leaves alone. Run
`go_symbol_references` before deleting anything exported or changing its
signature. Use `go_search` to find a symbol, `go_file_context` after first
reading a file, `go_package_api` for a package's exports, and `go_diagnostics`
after edits.

**After editing,** run these on the changed packages:

1. Preview modernizer rewrites with `go fix -diff ./path/to/pkg/...` and apply
   them only after review;
   [TOOLING.md](../skills/conventions-go/references/TOOLING.md) covers choosing
   fixers and `//go:fix inline`.
2. Format with `gofumpt -l -w .`, then group imports:

   ```bash
   goimports-reviser -company-prefixes "$(go list -m | cut -d/ -f1-2)" -project-name "$(go list -m)" ./...
   ```

3. Lint with `go vet ./...`, `go-critic check ./...`, and `staticcheck ./...`,
   and fix every finding. Fix the cause rather than suppress it; when a
   suppression is warranted, use the exact syntax in
   [LINTER-DIRECTIVES.md](LINTER-DIRECTIVES.md).

Install a missing tool with `go install` and one of
`mvdan.cc/gofumpt@latest`, `github.com/incu6us/goimports-reviser/v3@latest`,
`github.com/go-critic/go-critic/cmd/go-critic@latest`, or
`honnef.co/go/tools/cmd/staticcheck@latest`.

**Look it up.** When unsure, check the Go spec, `go doc`, the release notes, or
the module reference, and cite it rather than guess;
[TOOLING.md](../skills/conventions-go/references/TOOLING.md) covers `go doc`.

## Naming

Names must make sense without their type. Apply the delete-the-type test: if
you removed the type from a declaration, could a reader still tell what it
refers to?

- Abbreviate only `ctx`, `err`, `req`, `resp`, and `cfg`.
- Prefix a generic struct name with its domain (`DNSClient`, `VaultClient`),
  unless the package already narrows it (`redis.Client`).
- Name fields and variables by role or target, not by type.
- A generic name is fine when it's the only one of its kind in scope. When a
  second appears, rename both, not just the newcomer.
- Start default-value constants with `default`: `defaultDebugPort`, not
  `debugDefaultPort` or `portDefault`.
- Name a struct of dependencies for building a long-lived component
  `*Params` (`WorkerParams`), and a struct of inputs for one call `*Opts`
  (`FetchRecordOpts`).

```go
// Bad — names mirror the type, and the second is a suffix.
type Service struct {
	client     *http.Client
	repo       *MySQLRepository
	legacyRepo *PostgresRepository
}

// Good — each name says what it's for.
type Service struct {
	// auditRepo records who changed what, for compliance reviews.
	auditRepo *PostgresRepository
	// configRepo stores customer configs, the service's source of truth.
	configRepo *MySQLRepository
	// purgeAPI clears cached content after a config change.
	purgeAPI *http.Client
}
```

## Declarations

- **Structs:** sort fields alphabetically, embedded structs first. Put JSON
  tags on exported fields and `json:"-"` on internal-only ones. Use a pointer
  field when nil means "not provided", as in partial updates.
- **Constants and variables:** declare two or more together in one
  `const ( … )` or `var ( … )` block, with a comment above each entry:

  ```go
  const (
  	// defaultRefreshWindow is how long before expiry a token is renewed,
  	// leaving headroom for slow upstream calls.
  	defaultRefreshWindow = 5 * time.Minute
  	// maxTokenAge caps a token's lifetime to limit damage if one leaks.
  	maxTokenAge = 24 * time.Hour
  )
  ```
- **Imports:** three groups separated by blank lines: standard library, third
  party, then internal.
- **Enums:** use a string type with an `All*` slice for validation:

  ```go
  // ConditionType names what a routing rule matches on, so rules can be
  // stored and validated as data.
  type ConditionType string

  const (
  	// HeaderCondition matches on a request header.
  	HeaderCondition ConditionType = "header"
  	// GeoCondition matches on the client's location.
  	GeoCondition ConditionType = "geo"
  )

  // AllConditionTypes lists every valid ConditionType so input can be
  // validated against one source of truth.
  var AllConditionTypes = []ConditionType{HeaderCondition, GeoCondition}
  ```

**Constructors.** Write `NewX` factories that take dependencies and assign
fields alphabetically. Past 4 parameters, counting `ctx`, take a `*Params`
struct instead. For required parameters plus optional settings with sensible
defaults, `NewX` takes only the required ones and `WithXxx` methods set the
rest and return the receiver:

```go
// NewClient returns a Client for baseURL with safe defaults, so callers set
// only what differs.
func NewClient(baseURL string) *Client {
	return &Client{baseURL: baseURL, httpClient: http.DefaultClient, timeout: 30 * time.Second}
}

// WithTimeout overrides the request timeout, for callers whose upstream is
// slower or faster than the default allows.
func (c *Client) WithTimeout(d time.Duration) *Client {
	c.timeout = d
	return c
}
```

Skip `NewX` when it only copies arguments into fields and every caller is in
the same package; build the struct directly. Keep it when it sets defaults,
validates, derives state, or exposes unexported fields or types across a
package boundary. Don't export fields just to avoid a constructor.

**Interfaces.** Define one only to swap implementations, such as for mocks
or several real backends, not to wrap a single concrete type. Define it on the
consumer side, in `interface.go` when several packages share it, and add a
compile-time check: `var _ redis.Client = (*MockRedisClient)(nil)`.

## Comments

**Writing.** Comment every declaration: functions, methods, types, struct
fields, interface methods, constants, and variables, exported or not. Say
what it is or does and why it exists: the constraint, policy, invariant, or
caller need behind it. Describe the result or observable effect, not the
steps taken. Make the why specific; restating the name adds nothing. Start an
exported identifier's comment with its name.

```go
// Session tracks one authenticated client so requests can skip
// re-checking credentials.
type Session struct {
	// expiresAt is when the token stops being valid; RefreshToken renews
	// it early so long requests don't fail mid-flight.
	expiresAt time.Time
	// token is the bearer token sent upstream; unexported so callers
	// can't log or leak it.
	token string
}

// TokenStore persists session tokens so sessions survive a restart.
type TokenStore interface {
	// Save stores the token for the session, replacing any earlier one,
	// so a refresh never leaves two valid tokens.
	Save(ctx context.Context, sessionID, token string) error
}

// RefreshToken renews the session token before it expires. This avoids
// forcing active clients to reauthenticate during long requests.
func (s *Session) RefreshToken(ctx context.Context) error {
```

**Keeping.** Preserve doc comments on every identifier, exported or not;
markers (`TODO:`, `FIXME:`, `NOTE:`, `HACK:`, `XXX:`); directives
(`//go:build`, `//go:embed`, `//go:generate`, `// Deprecated:`, `//nolint:`),
which tools read; and comments explaining a hidden constraint, workaround, or
surprising behaviour. Remove only comments that restate the name below them,
describe code that no longer exists, or are commented-out code. Before
deleting a comment, classify it against these rules; if it isn't clearly
redundant or stale, keep it.

## Errors

Decide which outcomes are ordinary for the operation before choosing error
types. Handle a failure inside a module only if it can still fulfill the
caller's contract; otherwise return an error the caller can act on. Never
present unresolved corruption, denied authorization, or a violated invariant
as success. Retry only operations safe to repeat, and stop on cancellation or
deadline. After recovery, can the caller tell whether the operation succeeded
and what it can safely do next?

Pick the form by how callers react:

- **Wrapped** with `fmt.Errorf` and `%w`: the default; adds context and keeps
  the chain.
- **Sentinel** (`var ErrNotFound = errors.New("not found")`): only when
  callers in other packages branch on it with `errors.Is`.
- **Custom type** implementing `Error()` and `Unwrap()`: when callers need
  structured data, such as a status code or retry-after duration.

Classify errors for retry decisions with `errors.Is` and `errors.AsType`.
Prefer `errors.AsType[T]` (Go 1.26+) to `errors.As`:
`if dnsErr, ok := errors.AsType[*net.DNSError](err); ok { … }`. Never panic;
return errors.

Start every wrapped message with its package or layer name, in the form
`"<layer>: <what failed>: %w"`, so logs show where it came from. Don't repeat
the prefix inside the message:

```go
fmt.Errorf("service: failed to create config: %w", err)
fmt.Errorf("redis: failed to ping: %w", err) // not "failed to ping redis"
```

## Logging

Log at layer boundaries and on error paths, not in every function, and don't
log an error a caller already logs. Use `slog.LogAttrs` with the same event
name for success and failure; the level tells them apart. Write the event name
(the `msg` value, which the handler renames to `event`) and attribute keys in
snake_case; leave attribute values as they arrive. Group related attributes
with `slog.Group`. To silence a logger, especially in tests, use
`slog.New(slog.DiscardHandler)` (Go 1.24+) rather than a handler wrapping
`io.Discard`.

```go
logger.LogAttrs(ctx, slog.LevelError, "create_config",
	slog.String("config_id", configID),
	slog.Group("redis", slog.String("key", key), slog.Duration("ttl", ttl)),
	slog.Any("err", err),
)
```

## Concurrency and context

**Goroutines.** Use them for independent I/O-bound work where parallelism
cuts latency, such as fanning out to several services, not for CPU-bound
sequential logic, fast operations, or ordered work. Prefer `wg.Go` (Go 1.25+)
to manual `wg.Add`/`go`/`wg.Done`; its function must not panic.

**Cancellation.** Parent cancellation already reaches every child, so derive a
context only with a reason: `WithCancelCause` to cancel fan-out work
independently, or `WithTimeoutCause`/`WithDeadlineCause` for a tighter
deadline than the parent's. Always use the `*Cause` variants so every
cancellation carries a reason, pass causes through `context.AfterFunc`
callbacks, and read them with `context.Cause(ctx)` rather than `ctx.Err()`
alone:

```go
ctx, cancel := context.WithTimeoutCause(ctx, 5*time.Second, errors.New("service: timed out fetching config"))
defer cancel()
```

**Values.** Use context values only for request-scoped metadata that crosses
API boundaries, such as request ID, customer ID, or auth claims, never for
function arguments or configuration. Key each value with an unexported struct
type behind an exported variable, and read and write through generic helpers
defined once in a `contextx`-style package rather than per-type wrappers:

```go
// WithValue stores val under key, typed so readers don't repeat assertions.
func WithValue[T any](ctx context.Context, key any, val T) context.Context {
	return context.WithValue(ctx, key, val)
}

// FromContext returns the value under key as a T, and false when it's
// missing or another type, so callers never panic on a bad assertion.
func FromContext[T any](ctx context.Context, key any) (T, bool) {
	v, ok := ctx.Value(key).(T)
	return v, ok
}

// customerIDCtxKey is unexported so no other package can collide with it.
type customerIDCtxKey struct{}

// CustomerIDContextKey keys the request's customer ID, for code that needs
// the tenant without threading it through every signature.
var CustomerIDContextKey = customerIDCtxKey{}

ctx = contextx.WithValue(ctx, CustomerIDContextKey, "cust-123")
id, ok := contextx.FromContext[string](ctx, CustomerIDContextKey)
```

## Testing

Before writing or reviewing any `*_test.go` file, helper, mock, fuzz test, or
benchmark, load the [go-testing](../skills/go-testing/SKILL.md) skill for test
structure. These rules bind whatever you write:

- Unit-test logic, branches, and error cases in `*_test.go` with no build
  tags. Integration-test cross-package and handler/database boundaries with
  `//go:build e2e` in `e2e/` or godog `.feature` files.
- Test through the exported API, preferably from `package foo_test`. If
  internal branching is awkward to reach that way, extract it into a child
  package under `internal/` with its own public interface rather than testing
  private functions.
- Write table tests as a `testCases` slice looped with `tc` and `t.Run`.
- Mock with `testify/mock`, and add compile-time interface checks in test
  utility packages.
- Comment above each test function on what it validates.
- Use `http.NewRequestWithContext` and `httptest.NewRequestWithContext`, never
  the context-free versions, to satisfy the `noctx` linter.
- Always name the `httptest.NewRecorder()` result `rr`.
- Satisfy the `scopeguard` linter by folding a variable used only in an `if`
  into its init statement. Where that hurts readability, such as two short
  values compared to each other, suppress it instead:

  ```go
  if result := cm.extractCustomerID(tc.cacheKey); result != tc.expected {
  	t.Errorf("extractCustomerID(%q) = %q, expected %q", tc.cacheKey, result, tc.expected)
  }

  result := cm.customerKeySetName("customer123") //nolint:scopeguard // paired with expected below
  expected := "br:customer123:_keys"             //nolint:scopeguard // paired with result above
  ```

## Commands

Keep `main` thin: parse flags, build the logger and context, then call
`run(ctx, …) error` and exit non-zero if it fails. `run` holds the program and
returns errors rather than exiting, so it can be tested, and `main` is the
only place that calls `os.Exit`.

```go
// main wires flags, logging, and context, then hands off to run so the
// program logic stays testable.
func main() {
	flag.IntVar(&days, "days", defaultDays, "days before expiry to warn")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	ctx := context.Background()

	if err := run(ctx, logger); err != nil {
		logger.LogAttrs(ctx, slog.LevelError, "run", slog.Any("err", err))
		os.Exit(1)
	}
}
```

## Packages

Every package has a `doc.go` holding only the package comment and the
`package` clause, and a `README.md`. When you create a package, add both; when
you edit one, add whichever is missing, and update `doc.go` if the package's
purpose changed. Keep the `doc.go` comment to one or two sentences on what the
package does and why. Keep the README short: its purpose in a sentence or two,
a bullet list of what it owns, and a brief usage snippet, without repeating
godoc.

```go
// Package redis provides a thin wrapper around go-redis with
// connection pooling, health checks, and structured logging.
package redis
```
