---
paths:
  - '**/*.go'
---

> [!NOTE]
> If invoked directly with no specific task, load these conventions and stop.

House deltas for Go (CLIs, libraries, and services). In an established repo,
match its existing architecture where it differs.

- Match the `go` directive in `go.mod` unless the task includes an upgrade.
- For an HTTP/API service built as handlers → service → repository, also read
  [SERVICE-ARCHITECTURE.md](../skills/conventions-go/references/SERVICE-ARCHITECTURE.md). Do not apply
  that layering to other programs.

## Tooling

Prefer `gopls` over text search/`sed` when available (`go_rename_symbol` plus
`rg` for comments/docs/strings, `go_symbol_references` before breaking
signatures, `go_diagnostics` for type errors).

Before finishing Go changes, run on changed packages (or use the repo's
equivalent Make/lint targets):

1. `gofumpt -l -w .`
2. `goimports-reviser -company-prefixes "$(go list -m | cut -d/ -f1-2)" -project-name "$(go list -m)" ./...`
3. `go vet ./...`, `go-critic check ./...`, `staticcheck ./...`, and
   `gohawk ./path/to/pkg/...`

Preview modernizer rewrites with `go fix -diff ./path/to/pkg/...` when
modernizing. Fix root causes over suppressions; when a suppression is needed,
use the exact syntax in
[LINTER-DIRECTIVES.md](../skills/conventions-go/references/LINTER-DIRECTIVES.md). See
[TOOLING.md](../skills/conventions-go/references/TOOLING.md) for install commands, `go fix` options,
and `go doc` lookups.

## Naming and declarations

- **Role-based names:** Apply the delete-the-type test—names should make sense
  without their type. Abbreviate only `ctx`, `err`, `req`, `resp`, and `cfg`.
  Prefix generic structs with their domain (`DNSClient`) unless the package
  already narrows them (`redis.Client`). When a second value of the same kind
  enters scope, rename both.
- **Standard suffixes/prefixes:** Start default constants with `default`
  (`defaultDebugPort`). Name long-lived dependency structs `*Params` (required
  past 4 constructor args including `ctx`) and per-call input structs `*Opts`.
- **Layout:** Sort struct fields and constructor assignments alphabetically
  (embedded structs first). Tag internal-only exported struct fields
  `json:"-"`. Group related constants/variables in `const (...)`/`var (...)`
  blocks. Group imports as stdlib, third-party, then internal.
- **Enums:** String type plus an `All*` slice for validation.
- **Constructors:** Use `NewX` for required dependencies and fluent `WithXxx`
  methods returning the receiver for optional overrides. Skip `NewX` when a
  same-package struct needs no defaults, validation, or hidden fields.
- **Interfaces & embedding:** Define consumer-side interfaces only when
  swapping implementations (`interface.go` when shared), with a compile-time
  check (`var _ Store = (*MockStore)(nil)`). Access embedded fields explicitly
  (`s.Logger.Info(...)`, not `s.Info(...)`).
- **Stdlib preferences:** In new code, use stdlib constants (`http.MethodGet`,
  `http.StatusOK`, `os.Interrupt`) over magic literals and `net/netip`
  (`netip.Addr`, `netip.Prefix`, `netip.AddrPort`) over `net.IP`/`*net.IPNet`.
  Define package constants for repeated custom literals.

## Comments

Comment every declaration—functions, methods, types, struct fields, interface
methods, constants, and variables, exported or not. State what it is or does
and why it exists (constraint, policy, invariant, or caller need), describing
observable effect rather than steps, and never restating the name. Start
exported comments with the identifier name.

Preserve existing doc comments (exported or not), markers (`TODO:`, `FIXME:`,
`NOTE:`, `HACK:`, `XXX:`), directives (`//go:*`, `// Deprecated:`, `//nolint:`),
and why-comments; remove only comments that restate the name, are stale, or
are commented-out code.

## Errors and logging

- **Errors:** Start wrapped messages with the package or layer name without
  repeating it: `fmt.Errorf("redis: failed to ping: %w", err)`. Never swallow
  corruption, denied auth, or invariant violations. Prefer `errors.AsType[T]`
  (Go 1.26+) over `errors.As`. Return errors instead of panicking.
- **Logging:** Log at layer boundaries and error paths without double-logging.
  Use `slog.LogAttrs` with one snake_case event name across success and error
  (level distinguishes them), snake_case attribute keys, and `slog.Group` for
  related fields. Silence loggers with `slog.New(slog.DiscardHandler)`
  (Go 1.24+).

## Concurrency and context

- Prefer `wg.Go` (Go 1.25+, callback must not panic) over manual
  `wg.Add`/`go`/`wg.Done`.
- Use the `*Cause` variants (`WithCancelCause`, `WithTimeoutCause`,
  `WithDeadlineCause`) and read reasons via `context.Cause(ctx)`.
- Keep `context.Value` for request-scoped cross-boundary metadata only, keyed
  by an unexported struct type behind an exported var and accessed through
  generic `contextx` helpers rather than per-type wrappers.

## Testing

Read and follow [go-testing](../skills/go-testing/SKILL.md) before writing or
reviewing `*_test.go` files, and read and follow
[conventions-acceptance-tests](../skills/conventions-acceptance-tests/SKILL.md) for
acceptance suites.

- Test through exported APIs (`package foo_test` preferred); put integration
  tests under `//go:build e2e` in `e2e/` or godog `.feature` files. Don't test
  unexported helpers directly—reshape the API, delete unreachable branches, or
  extract a real `internal/` module.
- Table tests use `testCases` / `tc` / `t.Run`; mock with `testify/mock` plus
  compile-time interface checks; add a brief comment above each test stating
  what it validates.
- Use `http.NewRequestWithContext` / `httptest.NewRequestWithContext`
  (`noctx`), name recorders `rr`, and fold single-use `if` vars for
  `scopeguard` (or suppress with `//nolint:scopeguard` when paired values read
  clearer).

## Commands and packages

- Keep `main` thin: parse flags, build logger/context, call
  `run(ctx, ...) error`, and exit non-zero on error. Only `main` calls
  `os.Exit`.
- Every package has a `doc.go` (1–2 sentence package comment + `package`
  clause) and a short `README.md` (purpose, owned responsibilities, brief
  usage without repeating godoc).
