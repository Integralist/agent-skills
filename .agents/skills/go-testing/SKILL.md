---
name: go-testing
description: >-
  Write unit and integration tests for Go services. Use when
  creating, editing, or updating tests, test helpers, mocks, fuzz
  tests, or benchmarks in Go projects.
metadata:
  model-tier: moderate
---

# Go Testing

Write Go tests test-first, where each case proves one behaviour through the
package's public API. Load the conventions-go skill too: it sets the style and
linter rules for test code (`testCases`/`tc`, `rr`, `noctx`, `scopeguard`,
comments, `testify/mock`), and wins where the two overlap. Before writing or
changing tests, read [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md) for what
an assertion must protect. For acceptance suites, also load
[conventions-acceptance-tests](../conventions-acceptance-tests/SKILL.md): it
owns scenario-to-code structure for Go/Godog and Make/Bash workflows.

**Style.** When asked for unit tests, ask whether the user wants table-driven
tests (the default) or f-tests, a local helper `f` called from named subtests.

**Test-first in Go.** A test written before its types exist fails to compile,
which doesn't count as red. So:

1. Stub the types and signatures, returning zero values or a sentinel such as
   `errors.New("unimplemented")`.
2. Write the test against the stub and run `go test`; it must compile and
   fail on its assertion.
3. Write the least code that passes, then tidy up and delete dead code.

## What each test proves

- **One behaviour per case.** The case name states it; a case proving two
  things becomes two cases.
- **Every error path.** Each `if err != nil` branch in production code gets a
  case that checks the failure, matching errors with `errors.Is` or
  `errors.AsType`. Match on a substring only for an unexported third-party
  error.
- **Real assertions.** Assert state changes, header values, or payloads, never
  only `assert.NoError` when the call returns values. Assert the fields that
  matter rather than whole structs with `reflect.DeepEqual` or `cmp.Diff`,
  which fail on timestamps and generated IDs.
- **Nothing unused.** Deleting any field or setup step must break the test.
  Split cases with different setup into separate tables.
- **Distinct paths only.** Each case covers its own branch or dimension, not
  a trivial variation of another. Add to an existing table before writing a
  new `Test*` function.
- **Cancellation.** A long-running, I/O-bound, or goroutine-spawning function
  gets a test proving it stops promptly when `ctx` is cancelled.
- **Public API.** Test through exported names, preferably from
  `package foo_test`, and delete branches no public path reaches. When
  internal logic has intricate branching or state, extract it to a child
  package under `internal/` with an exported API and test it there.
- **No coverage loss.** Refactoring tests must never lower package statement
  coverage (`go test -cover`).

## Patterns

**Testify mocks.** When a test double embeds `mock.Mock`, call its methods
through the embedded field—for example, `m.Mock.Called(...)` rather than
`m.Called(...)`. The explicit receiver makes the mock dependency visible.

**Table-driven:**

```go
// TestNormalize proves Normalize upper-cases input and rejects empty
// strings with ErrEmptyInput.
func TestNormalize(t *testing.T) {
	testCases := []struct {
		// name states the behaviour this case proves.
		name string
		// input is passed to Normalize.
		input string
		// expected is the result on success.
		expected string
		// wantErr is the sentinel to match with errors.Is, or nil.
		wantErr error
	}{
		{name: "upper-cases valid input", input: "hello", expected: "HELLO"},
		{name: "rejects empty input", input: "", wantErr: ErrEmptyInput},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := Normalize(tc.input)
			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("expected %v, got %v", tc.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result != tc.expected {
				t.Errorf("expected %q, got %q", tc.expected, result)
			}
		})
	}
}
```

When cases prove one invariant across operations with different signatures,
give each case an `invoke func(*Repository) error` closure rather than
reaching for generics.

**F-test:**

```go
// TestShout proves Shout upper-cases its input.
func TestShout(t *testing.T) {
	// f checks one input against its expected output.
	f := func(t *testing.T, input, expected string) {
		t.Helper()
		if got := Shout(input); got != expected {
			t.Fatalf("Shout(%q) = %q; want %q", input, got, expected)
		}
	}

	t.Run("converts to uppercase", func(t *testing.T) { f(t, "hello", "HELLO") })
	t.Run("handles empty string", func(t *testing.T) { f(t, "", "") })
}
```

**Helpers and context.** Call `t.Helper()` in every helper. Pass
`t.Context()` (Go 1.24+), not `context.Background()`, to code under test; it
cancels when the test ends. Don't block on a bare `<-t.Context().Done()` for
an async wait, or a stuck test hangs until the suite times out; bound it:

```go
ctx, cancel := context.WithTimeout(t.Context(), time.Second)
defer cancel()

select {
case <-renewed:
case <-ctx.Done():
	t.Fatalf("claim was not renewed: %v", ctx.Err())
}
```

**Assertions.** Prefer `t.Errorf` and `t.Fatalf`; use `testify/assert` for
complex checks.

## Running and references

```bash
make test                                    # unit tests
make test-integration                        # integration tests
go test -v -run TestName ./pkg/...           # one test
go test -race ./...                          # race detector
go test -cover ./...                         # coverage
```

For specialised work, read:

- [INTEGRATION.md](INTEGRATION.md): e2e tests under the `e2e` build tag.
- [ACCEPTANCE.md](ACCEPTANCE.md): a runnable Godog wiring example for the
  canonical living features.
- [FUZZ-AND-BENCHMARKS.md](FUZZ-AND-BENCHMARKS.md): `testing.F` fuzzing and
  `b.Loop()` benchmarks.
- [COVERAGE-PRUNING.md](COVERAGE-PRUNING.md): finding and pruning overlapping
  tests with Tobari.
- The mutation-testing skill: checking whether tests catch behaviour changes.
