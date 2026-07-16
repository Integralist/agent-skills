# Task Document Template

Fill this scaffold into `docs/tasks/<yyyy-mm-dd>-<slug>.md`. `{...}` are
placeholders; the surrounding prose is fixed text that ships to the executor —
keep it verbatim. Replace the example tasks with the real ones.

````markdown
# {Feature} — Task List

- **Status:** Ready
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language}
- **Source:** {plan/research doc paths, or "in-session planning"}

## How to execute this list

Work top to bottom, one task at a time; do not skip ahead. For each task:

1. Add the **Test (red)** exactly as written, run its command, and confirm it
   fails with the stated failure.
1. Add the **Implementation (green)** as written.
1. Run **Verify** and confirm it passes.
1. Tick the task's checkbox only then.

The passing test is the contract. If the implementation does not pass, fix the
implementation — never edit the test or weaken the check to force it green.

Before marking the whole list done:

- **Consistency** — if you changed a signature or pattern, `grep` every call
  site and apply the identical change.
- **Scope** — change nothing beyond these tasks.
- **Verification** — run the full test package these tasks live in, not only the
  tests you expected to flip.

## Context for the executor

{One paragraph: what the finished change does.}

Existing code the tasks build on (verified — do not re-explore):

- `{path/to/file.go:NN}` — {signature or fact the tasks depend on}

Conventions and gotchas:

- {e.g. handlers → service → repository; table-driven tests; wrap errors with %w}

## Tasks

### Task 1: Add `ParsePort`, rejecting out-of-range values

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
