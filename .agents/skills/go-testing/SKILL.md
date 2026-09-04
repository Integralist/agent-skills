---
name: go-testing
description: >-
  Write unit and integration tests for Go services. Use when
  creating, editing, or updating tests, test helpers, mocks, fuzz
  tests, or benchmarks in Go projects.
---

# Go Testing

Guidelines for writing tests in Go services following
established patterns.

> [!NOTE]
> [`conventions-go`](../conventions-go/SKILL.md) is the authority for Go
> style and linter rules (`noctx`, `scopeguard`, mandatory test doc
> comments). Load it alongside this skill; where the two overlap, it
> wins. This skill covers test structure and templates.

## Instructions

When asked to write unit tests, ask the user if they prefer:

- **Table-driven tests** - test cases defined in a struct slice
- **F-tests** - helper function `f` with explicit named subtests

If not specified, default to table-driven tests.

## TDD Cycle in Go

In compiled Go, a test written before types exist causes compilation failure,
not an assertion failure. Always follow the 3-step TDD cycle:

1. **Stub signatures:** Define types and empty function/method signatures
   returning zero values or sentinel errors (e.g. `return nil, errors.New("unimplemented")`).
2. **Red test:** Write the test against the stub. Run `go test` to confirm it
   **compiles and fails on assertion**.
3. **Green implementation:** Write the minimum logic to pass the test, then
   refactor and clean dead code.

## What Each Test Proves

Applies to all test styles (table-driven, f-tests, HTTP,
integration):

- **One behavior per case.** The case `name` states the exact
  behavior being proven. If a case proves two things, split it
  into two cases. (The `Test*` doc comment covers the whole set,
  so it may name several.)
- **Error path parity.** Every `if err != nil` branch in production code must
  have a corresponding test case verifying the failure behavior and sentinel
  matching via `errors.Is` or `errors.AsType`.
- **No vacuous assertions.** Assertions must verify actual state mutations,
  header values, or payload contents—never assert only the absence of an error
  (`assert.NoError`) when return values are expected.
- **Context cancellation.** Long-running, I/O-bound, or goroutine-spawning
  functions must have a test proving they terminate promptly when `ctx` is
  canceled.
- **Use `t.Context()`.** Pass `t.Context()` (Go 1.24+) rather than
  `context.Background()` to operations under test to guarantee automatic
  cleanup, cancellation on failure, and subtest scoping.
- **No unused fields or setup.** Deleting any field or setup step
  must break the test. Beyond the expected-value and
  expected-error pair, fields used by only a subset of cases
  belong in separate test tables.
- **Assert targeted fields, not whole structs.** Avoid deep
  struct comparisons (`reflect.DeepEqual`, `cmp.Diff` on entire
  structs) that fail on irrelevant fields (e.g., timestamps,
  generated IDs).
- **Distinct code paths only.** Do not duplicate tests with
  trivial input variations. Each case must cover a unique branch
  or dimension.
- **Extend existing tables first.** When fixing a bug or adding
  an edge case, add a case to an existing table-driven test
  rather than creating a new standalone `Test*` function.
  Reserve standalone tests for distinct workflows or setups.
- **Zero coverage regression.** Pruning or refactoring test code
  must never decrease package statement coverage
  (`go test -cover`).
- **Match errors by identity.** Use `errors.Is` or `errors.As`.
  Only fall back to substring matching (`strings.Contains`) for
  unexported errors in third-party packages.
- **Test through the public interface.** Exercise package behavior through
  exported functions and types (`package foo_test` preferred). Unexported
  functions are exercised indirectly through public contracts. Do not write
  unit tests targeting unexported helpers directly. If an unexported branch
  cannot be reached through any public entry point, delete it as dead code.
- **Extract child packages for complex internals.** When an internal helper or
  algorithm has intricate branching, state machines, or edge cases that cause
  combinatorial explosion if tested solely through the outer API, do not bypass
  encapsulation by testing private functions. Extract that logic into a focused
  child package under `internal/` (e.g., `internal/parser`), give it a clean
  exported interface, and unit-test that sub-package's public API directly.

## Unit Tests

Unit tests live alongside source code (`*_test.go`) and run with
`make test` or `go test ./...`.

### Table-Driven Tests

Use table-driven tests with `t.Run()` for clear, maintainable
test cases:

```go
// ErrEmptyInput is declared by the package under test:
//     var ErrEmptyInput = errors.New("input cannot be empty")

// TestFunctionName verifies FunctionName upper-cases input and rejects empty strings.
func TestFunctionName(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected string
        wantErr  error // sentinel to match with errors.Is
    }{
        {
            name:     "valid input",
            input:    "hello",
            expected: "HELLO",
        },
        {
            name:    "empty input returns error",
            input:   "",
            wantErr: ErrEmptyInput,
        },
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
                t.Errorf("expected %q, got %q",
                    tt.expected, result)
            }
        })
    }
}
```

### Repeated behavior with different operations

When several tests prove the same behavior and differ only by the operation or
its inputs, consolidate them into one table-driven test with named subtests.
Normalize different method signatures with a function-valued case field, usually
an operation closure:

```go
testCases := []struct {
    name   string
    invoke func(*Repository) error
}{
    {
        name: "published outbox row",
        invoke: func(repository *Repository) error {
            return repository.MarkPublished(ctx, eventID, token, now)
        },
    },
    {
        name: "delivered notification",
        invoke: func(repository *Repository) error {
            return repository.MarkNotificationDelivered(ctx, notificationID, token, now)
        },
    },
}
```

Prefer closures over generics when the variation is which method is called or
which arguments it receives; generics add value when type parameters remove
real type-specific duplication. Keep separate tests when the cases have
meaningfully different setup, assertions, or behaviors.

### F-Tests (Alternative Style)

F-tests hoist assertion logic into a helper function `f`, making
test cases more readable. This style works well when you want
explicit, named subtests without the verbosity of table structs:

```go
func TestSomeFuncWithSubtests(t *testing.T) {
    f := func(t *testing.T, input, expected string) {
        t.Helper()

        output := SomeFunc(input)
        if output != expected {
            t.Fatalf("unexpected output; got %q; want %q",
                output, expected)
        }
    }

    t.Run("converts_to_uppercase", func(t *testing.T) {
        f(t, "hello", "HELLO")
    })

    t.Run("handles_empty_string", func(t *testing.T) {
        f(t, "", "")
    })

    t.Run("preserves_numbers", func(t *testing.T) {
        f(t, "abc123", "ABC123")
    })
}
```

You can also combine f-tests with table-driven tests for the
best of both approaches:

```go
func TestThing_Success(t *testing.T) {
    f := func(t *testing.T, input1, input2 string, expected int) {
        t.Helper()

        result := Thing(input1, input2)
        if result != expected {
            t.Fatalf("Thing(%q, %q) = %d; want %d",
                input1, input2, result, expected)
        }
    }

    tests := []struct {
        name     string
        input1   string
        input2   string
        expected int
    }{
        {name: "both_empty", input1: "", input2: "",
            expected: 0},
        {name: "first_only", input1: "foo", input2: "",
            expected: 3},
        {name: "both_set", input1: "foo", input2: "bar",
            expected: 6},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            f(t, tt.input1, tt.input2, tt.expected)
        })
    }
}
```

### Test Helpers

Mark helper functions with `t.Helper()` so errors report the
correct line:

```go
func assertStatusCode(t *testing.T, got, want int) {
    t.Helper()
    if got != want {
        t.Errorf("expected status %d, got %d", want, got)
    }
}

func newTestLogger(t *testing.T) *slog.Logger {
    t.Helper()
    var buf bytes.Buffer
    return slog.New(slog.NewJSONHandler(&buf, nil))
}
```

### Test Context (`t.Context()`)

Prefer `t.Context()` (Go 1.24+) over `context.Background()` in unit tests:

- **Automatic lifecycle management:** Context cancels automatically when the
  test or subtest finishes, preventing goroutine leaks without manual
  `defer cancel()`.
- **Immediate cancellation on failure:** Context cancels the instant a test
  fails (e.g. `t.Fatal()`, `t.FailNow()`), aborting in-flight network requests,
  database queries, or blocking channels immediately.
- **Clean subtest scoping:** Subtests in `t.Run()` receive a context bounded
  strictly to their lifetime; cancellation does not affect parent or sibling
  subtests.

```go
func TestService(t *testing.T) {
    t.Run("child task", func(t *testing.T) {
        ctx := t.Context()
        res, err := worker.Do(ctx)
        // ...
    })
}
```

#### Bounded Async Channel Waits

Do not replace assertion timeouts with bare `<-t.Context().Done()`. Because
`t.Context()` cancels only when the test finishes, fails, or cleans up, a
blocked channel wait will hang until the test runner's global timeout.

Derive a bounded timeout from `t.Context()` instead:

```go
ctx, cancel := context.WithTimeout(t.Context(), time.Second)
defer cancel()

select {
case <-renewed:
case <-ctx.Done():
    t.Fatalf("claim was not renewed: %v", ctx.Err())
}
```

### HTTP Handler Tests

Use `httptest` for testing HTTP handlers:

```go
func TestHandler(t *testing.T) {
    tests := []struct {
        name           string
        method         string
        path           string
        body           string
        expectedStatus int
    }{
        {
            name:           "GET returns 200",
            method:         http.MethodGet,
            path:           "/api/v1/resource",
            expectedStatus: http.StatusOK,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            var reqBody io.Reader
            if tt.body != "" {
                reqBody = bytes.NewBufferString(tt.body)
            }

            req := httptest.NewRequestWithContext(
                t.Context(), tt.method, tt.path, reqBody)
            req.Header.Set(
                "Content-Type", "application/json")

            rr := httptest.NewRecorder()

            handler := NewHandler(/* dependencies */)
            handler.ServeHTTP(rr, req)

            if rr.Code != tt.expectedStatus {
                t.Errorf("expected status %d, got %d",
                    tt.expectedStatus, rr.Code)
            }
        })
    }
}
```

### Mocks

Use `testify/mock`. Embed `mock.Mock`, record calls with `m.Called`,
and add a compile-time interface check:

```go
type MockClient struct {
    mock.Mock
}

var _ Client = (*MockClient)(nil)

func (m *MockClient) DoSomething(ctx context.Context, id string) error {
    args := m.Called(ctx, id)
    return args.Error(0)
}
```

Set expectations in the test and assert them:

```go
m := &MockClient{}
m.On("DoSomething", mock.Anything, "abc").Return(nil)

// exercise code under test with m ...

m.AssertExpectations(t)
```

### Assertions

Prefer standard library assertions for unit tests. Use
`testify/assert` for complex assertions or integration tests:

```go
if result != expected {
    t.Errorf("expected %v, got %v", expected, result)
}

import "github.com/stretchr/testify/assert"

assert.Equal(t, expected, result, "values should match")
assert.Contains(t, haystack, needle,
    "should contain substring")
assert.NotNil(t, obj, "object should not be nil")
```

## Scoped Coverage & Test Pruning

Aggregate coverage (`go test -cover`) measures total code
touched by the suite, not which test exercises which
statements. When suites accumulate redundant tests, use scoped
coverage with [Tobari](https://github.com/goccy/tobari) to map
per-test execution and prune overlap.

### Identifying Redundancy with Tobari

1. Install Tobari:

   ```bash
   go install github.com/goccy/tobari/cmd/tobari@latest
   ```

2. Run package tests with scoped coverage hooks:

   ```bash
   GOFLAGS="$(tobari flags)" go test ./path/to/package
   ```

3. Generate the HTML overlap matrix:

   ```bash
   tobari html tobari/tobari.json
   ```

### Consolidation Rules

- **Target high-overlap pairs:** Focus on test pairs with high
  statement overlap (e.g. 70%+). Consolidate standalone tests
  exercising the same code paths into a single table-driven test
  or F-test.
- **Preserve distinct assertions:** High statement overlap does
  not mean duplicate tests. Two tests may execute the same path
  while asserting different state or invariants. Ensure all
  distinct checks and failure paths are preserved during
  consolidation.
- **Verify coverage invariants:** Run `go test -cover` before
  and after pruning. Test count should decrease while statement
  coverage remains equal or higher.

## Integration Tests

Integration tests use the `e2e` build tag and live in the `e2e/`
directory. Run with `make test-integration`.

### Build Tag

All integration test files must start with:

```go
//go:build e2e

package e2e_test
```

### Test Structure

Integration tests validate complete workflows:

```go
//go:build e2e

package e2e_test

import (
    "net/http"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
)

const (
    baseURL = "http://localhost:8080"
    apiKey  = "test-api-key"
)

var client = &http.Client{Timeout: 10 * time.Second}

func TestE2EWorkflow(t *testing.T) {
    t.Run("Scenario: Complete CRUD workflow",
        testCRUDWorkflow)
    t.Run("Scenario: Error handling",
        testErrorHandling)
}
```

## Fuzz Tests

Fuzz tests discover edge cases through randomized inputs. Use
for security-critical validation:

```go
func FuzzValidatePath(f *testing.F) {
    f.Add("/")
    f.Add("/api/v1")
    f.Add("/users/123")
    f.Add("")
    f.Add("no-leading-slash")
    f.Add("/path/../traversal")

    f.Fuzz(func(t *testing.T, path string) {
        if !utf8.ValidString(path) {
            t.Skip("skipping invalid UTF-8")
        }

        result := ValidatePath(path)

        if result {
            if !strings.HasPrefix(path, "/") {
                t.Errorf(
                    "valid path %q should start with /",
                    path)
            }
        }
    })
}
```

Run fuzz tests: `go test -fuzz=FuzzValidatePath -fuzztime=30s ./...`

## Benchmarks

Use benchmarks to measure and track performance:

```go
func BenchmarkOperation(b *testing.B) {
    data := prepareTestData()

    for b.Loop() {
        _ = Operation(data)
    }
}

func BenchmarkOperationParallel(b *testing.B) {
    data := prepareTestData()

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            _ = Operation(data)
        }
    })
}
```

Run benchmarks: `go test -bench=. -benchmem ./...`

## Running Tests

```bash
# Unit tests
make test

# Integration tests (starts full stack)
make test-integration

# Specific test
go test -v -run TestFunctionName ./internal/pkg/...

# With race detection
go test -race ./...

# With coverage
go test -cover ./...

# Scoped coverage & overlap report (Tobari)
GOFLAGS="$(tobari flags)" go test ./path/to/pkg && tobari html tobari/tobari.json
```
