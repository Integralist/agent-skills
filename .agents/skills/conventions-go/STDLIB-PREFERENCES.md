# Standard Library Preferences

Prefer newer stdlib packages over their older equivalents in new
code. When editing existing code that uses an older API listed
below, ask the user whether they want to migrate it to the newer
equivalent before proceeding.

## Use stdlib constants over magic literals

When the standard library defines a named constant for a value,
use it instead of a string or numeric literal. The constant
documents intent, survives refactors, and catches typos at
compile time — `"GOT"` compiles; `http.MethodGot` does not.

Common cases:

| Magic literal                      | Stdlib constant                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `"GET"`, `"POST"`, `"DELETE"`, ... | `http.MethodGet`, `http.MethodPost`, `http.MethodDelete`, ...                 |
| `200`, `404`, `500`, ...           | `http.StatusOK`, `http.StatusNotFound`, `http.StatusInternalServerError`, ... |
| Signals (`SIGINT`, `SIGTERM`, ...) | `os.Interrupt`, `syscall.SIGTERM`, ...                                        |
| File modes (`0644`, `0755`)        | `fs.FileMode` values; `os.ModePerm`                                           |
| Time units as `time.Duration` ints | `time.Second`, `time.Millisecond`, ...                                        |

```go
// Bad
req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
if resp.StatusCode == 200 { ... }

// Good
req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
if resp.StatusCode == http.StatusOK { ... }
```

When a repeated literal has no stdlib constant (e.g.
`"application/json"`, a custom header name, `"tcp"`/`"udp"`),
define a package-level `const` so the value has one source of
truth.

## `net/netip` over `net` for IP types (Go 1.18+)

The `net/netip` package provides value-typed, comparable,
allocation-free replacements for the pointer-heavy types in
`net`:

| Old (`net`) | New (`net/netip`) | Benefit                           |
| ----------- | ----------------- | --------------------------------- |
| `net.IP`    | `netip.Addr`      | Value type, comparable, no allocs |
| `net.IPNet` | `netip.Prefix`    | Value type, comparable            |
| —           | `netip.AddrPort`  | IP+port as a single value type    |

```go
// Bad — pointer-based, not comparable.
var cidr *net.IPNet

// Good — value type, usable as map key.
var prefix netip.Prefix
```

Convert at boundaries when interacting with APIs that still use
`net` types:

```go
addr := netip.MustParseAddr("10.0.0.1")
stdIP := addr.AsSlice() // -> net.IP for legacy APIs

stdAddr, ok := netip.AddrFromSlice(legacyIP) // net.IP -> netip.Addr
```
