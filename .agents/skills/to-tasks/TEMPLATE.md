# Task Document Template

Fill this scaffold into `projects/<yyyy-mm-dd>-<slug>/tasks-slice-<n>.md` or
`projects/<yyyy-mm-dd>-<slug>/tasks.md`. `{...}` are placeholders; the
surrounding prose is fixed text that ships to the executor — keep it verbatim.
Replace the example tasks and milestone coverage with the real source keys.
Task IDs are local executable-work identifiers, not copies of plan milestone
numbers. For legacy plans, preserve their existing labels as source keys.

````markdown
# {Feature} — Task List

- **Status:** Ready
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language}
- **Source:** {plan/research doc paths, or "in-session planning"}

## Summary

{Reader-facing summary of this slice.}

## Pull Request Delivery

- **Mode:** {Single PR | Stack | Independent PRs}

| Layer | Base              | Tasks     | Branch            |
| ----- | ----------------- | --------- | ----------------- |
| 1     | `{trunk}`         | Tasks 1–3 | `{bottom-branch}` |
| 2     | `{bottom-branch}` | Tasks 4–6 | `{top-branch}`    |

## How to execute this list

Work top to bottom, one task at a time; do not skip ahead. For each task:

1. Find its layer in `Pull Request Delivery`. Complete every task assigned to
   that layer on the same branch. Create or switch stack branches only when
   crossing a layer boundary.
2. Add the **Test (red)** exactly as written, run its command, and confirm it
   fails with the stated failure.
3. Add the **Implementation (green)** as written.
4. Run **Verify** and confirm it passes.
5. Tick the task's checkbox only then.

For coordinated `execute-plan`, apply this protocol only to the assigned task;
return evidence before another task. The coordinator owns checkbox updates and
commits. A task's completion does not itself complete any supported milestone.

The passing test is the contract. If the implementation does not pass, fix the
implementation — never edit the test or weaken the check to force it green.

Before marking the whole list done:

- **Consistency** — if you changed a signature or pattern, `grep` every call
  site and apply the identical change.
- **Scope** — change nothing beyond these tasks.
- **Verification** — run the full test package these tasks live in, not only the
  tests you expected to flip.

## Context for the executor

Existing code the tasks build on (verified — do not re-explore):

- `{path/to/file.go:NN}` — {signature or fact the tasks depend on}

Conventions and gotchas:

- {e.g. handlers → service → repository; table-driven tests; wrap errors with %w}

## Milestone coverage

Source milestones and linked spec criteria: {source plan/slice reference}.
This table maps tasks to outcomes; it does not duplicate milestone checkboxes.
Replace the example rows with actual keys, including already-verified outcomes
and their evidence when no new implementation is needed.

| Source milestone | Compiled tasks | Outcome verification |
| --- | --- | --- |
| M1.1: Valid input is accepted | Task 1 | `TestParsePort` valid-input case |
| M1.2: Invalid input is rejected | Tasks 1, 2 | Invalid-input cases and {boundary check} |

## Tasks

### Task 1: Add `ParsePort`, rejecting out-of-range values

Validate and parse input strings into TCP/UDP port numbers, returning an error
for values outside 1–65535 or non-numeric input.

- **Supports:** M1.1, M1.2 (source plan)
- **Location:** `netutil/port_test.go`, `netutil/port.go`

**Test (red)** — add to `netutil/port_test.go`:

```go
func TestParsePort(t *testing.T) {
	tests := []struct {
		name    string
		in      string
		want    int
		wantErr bool
	}{
		{name: "valid", in: "8080", want: 8080},
		{name: "out of range", in: "70000", wantErr: true},
		{name: "non-numeric", in: "http", wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParsePort(tt.in)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParsePort(%q) err = %v, wantErr %v", tt.in, err, tt.wantErr)
			}
			if got != tt.want {
				t.Errorf("ParsePort(%q) = %d, want %d", tt.in, got, tt.want)
			}
		})
	}
}
```

Run `go test ./netutil/`; expect `undefined: ParsePort`.

**Implementation (green)** — add to `netutil/port.go`:

```go
package netutil

import (
	"fmt"
	"strconv"
)

// ParsePort parses a TCP/UDP port, rejecting values outside 1–65535.
func ParsePort(s string) (int, error) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("parse port %q: %w", s, err)
	}
	if n < 1 || n > 65535 {
		return 0, fmt.Errorf("port %d out of range 1-65535", n)
	}
	return n, nil
}
```

**Verify:** `go test ./netutil/` → `ok  <module>/netutil`.

- [ ] Task 1 complete

### Task 2: {what it delivers}

{Brief description of what this task delivers.}

- **Supports:** {source milestone/requirement keys; independent of Task 2's ID}
- **Location:** `{path}`, `{path}`

**Test (red)** — add to `{path}`:

```{language}
{verbatim test}
```

Run `{command}`; expect `{failure}`.

**Implementation (green)** — add to `{path}`:

```{language}
{verbatim implementation}
```

**Verify:** `{command}` → `{expected output}`.

- [ ] Task 2 complete
````
