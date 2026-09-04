---
name: go-testing
description: >-
  Write unit and integration tests for Go services. Use when
  creating, editing, or updating tests, test helpers, mocks, fuzz
  tests, or benchmarks in Go projects.
---

# Go Testing

Guidelines for writing unit tests and following TDD in Go services.

> [!NOTE]
> [`conventions-go`](../conventions-go/SKILL.md) is the authority for Go style
> and linter rules (`noctx`, `scopeguard`, doc comments). Load it alongside
> this skill; where they overlap, it wins.

## Instructions

When asked to write unit tests, ask the user if they prefer:

- **Table-driven tests** — test cases defined in a struct slice (default).
- **F-tests** — helper function `f` with explicit named subtests.

## TDD Cycle in Go

In compiled Go, tests written before types exist fail compilation, not
assertion. Follow the 3-step cycle:

1. **Stub signatures:** Define types and empty signatures returning zero values
   or sentinel errors (e.g. `return nil, errors.New("unimplemented")`).
2. **Red test:** Write the test against the stub. Run `go test` to confirm it
   compiles and fails on assertion.
3. **Green implementation:** Write the minimum logic to pass, refactor, and
   clean dead code.

## What Each Test Proves

Applies to all test styles:

- **One behavior per case:** The case `name` states the exact behavior proven.
  If a case proves two things, split it into two cases.
- **Error path parity:** Every `if err != nil` branch in production code must
  have a corresponding test case verifying failure behavior and sentinel
  matching via `errors.Is` or `errors.AsType`.
- **No vacuous assertions:** Assert actual state mutations, header values, or
  payload contents — never assert only `assert.NoError` when return values are
  expected.
- **Context cancellation:** Functions that are long-running, I/O-bound, or
  spawn goroutines must have a test proving prompt termination when `ctx` is
  canceled.
- **Use `t.Context()`:** Pass `t.Context()` (Go 1.24+) rather than
  `context.Background()` to operations under test.
- **No unused fields or setup:** Deleting any field or setup step must break the
  test. Separate tests with distinct setup requirements into separate tables.
- **Assert targeted fields:** Avoid deep struct comparisons
  (`reflect.DeepEqual`, `cmp.Diff`) that fail on irrelevant fields (e.g.,
  timestamps, generated IDs).
- **Distinct code paths only:** Do not duplicate tests with trivial input
  variations. Each case covers a unique branch or dimension.
- **Extend existing tables first:** Add cases to existing tables before
  creating standalone `Test*` functions.
- **Zero coverage regression:** Refactoring tests must never decrease package
  statement coverage (`go test -cover`).
- **Match errors by identity:** Use `errors.Is` or `errors.As`. Substring
  matches (`strings.Contains`) are permitted only for unexported third-party
  errors.
- **Test through the public interface:** Prefer `package foo_test`. Test
  unexported helpers through public contracts; delete unreached branches as
  dead code.
- **Extract child packages for complex internals:** When internal logic has
  intricate branching or state machines, extract it to a child package under
  `internal/` with an exported API and unit-test it there. Do not bypass
  encapsulation by testing private functions.

## Test Styles & Patterns

### Table-Driven Tests

```go
func TestFunctionName(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected string
        wantErr  error // sentinel to match with errors.Is
    }{
        {name: "valid input", input: "hello", expected: "HELLO"},
        {name: "empty input", input: "", wantErr: ErrEmptyInput},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := FunctionName(tt.input)

            if tt.wantErr != nil {
                if !errors.Is(err, tt.wantErr) {
                    t.Fatalf("expected %v, got %v", tt.wantErr, err)
                }
                return
            }
            if err != nil {
                t.Fatalf("unexpected error: %v", err)
            }
            if result != tt.expected {
                t.Errorf("expected %q, got %q", tt.expected, result)
            }
        })
    }
}
```

### Operation Closures for Varied Signatures

When tests prove the same invariant across different operations, normalize
signatures with an operation closure rather than generics:

```go
tests := []struct {
    name   string
    invoke func(*Repository) error
}{
    {
        name: "published outbox row",
        invoke: func(r *Repository) error {
            return r.MarkPublished(ctx, eventID, token, now)
        },
    },
    {
        name: "delivered notification",
        invoke: func(r *Repository) error {
            return r.MarkNotificationDelivered(ctx, notificationID, token, now)
        },
    },
}
```

### F-Tests (Alternative Style)

Hoist assertion logic into a local helper function `f`:

```go
func TestSomeFunc(t *testing.T) {
    f := func(t *testing.T, input, expected string) {
        t.Helper()
        if got := SomeFunc(input); got != expected {
            t.Fatalf("SomeFunc(%q) = %q; want %q", input, got, expected)
        }
    }

    t.Run("converts to uppercase", func(t *testing.T) { f(t, "hello", "HELLO") })
    t.Run("handles empty string", func(t *testing.T) { f(t, "", "") })
}
```

## Unit Test Conventions

- **Helpers:** Mark helper functions with `t.Helper()` for accurate line
  reporting.
- **Test Context (`t.Context()`):** Cancels automatically when test or subtest
  finishes or fails. For bounded async waits, do not block bare on
  `<-t.Context().Done()`. Derive a timeout to prevent hanging until suite
  timeout:

  ```go
  ctx, cancel := context.WithTimeout(t.Context(), time.Second)
  defer cancel()

  select {
  case <-renewed:
  case <-ctx.Done():
      t.Fatalf("claim was not renewed: %v", ctx.Err())
  }
  ```

- **HTTP Handlers:** Use
  `httptest.NewRequestWithContext(t.Context(), method, path, body)` and
  `httptest.NewRecorder()`.
- **Mocks:** Use `testify/mock`. Include compile-time interface assertion:
  `var _ Client = (*MockClient)(nil)`.
- **Assertions:** Prefer standard library (`t.Errorf`, `t.Fatalf`). Use
  `testify/assert` for complex assertions.

## Disclosed Reference

Consult these sibling documents when working in specialized areas:

- [`INTEGRATION.md`](INTEGRATION.md) — E2E test structure, `//go:build e2e`
  tags, and running full-stack tests.
- [`FUZZ-AND-BENCHMARKS.md`](FUZZ-AND-BENCHMARKS.md) — Fuzz testing with
  `testing.F` and benchmarking with `b.Loop()`.
- [`COVERAGE-PRUNING.md`](COVERAGE-PRUNING.md) — Mapping statement coverage
  overlap and pruning redundant tests with Tobari.

## Running Tests

```bash
make test                                      # Unit tests
make test-integration                          # Integration tests
go test -v -run TestFunctionName ./pkg/...     # Specific test
go test -race ./...                            # Race detection
go test -cover ./...                           # Coverage summary
```
