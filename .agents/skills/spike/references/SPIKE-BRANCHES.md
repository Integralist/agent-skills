# Go spike branches and verdict format

Pick the narrowest branch that answers the stated question. Do not mix
branches in one spike.

## Feasibility

Use when validating whether an external dependency, protocol, kernel feature,
or database behavior works as assumed.

- Write a minimal `main.go` (`go run .`) hitting the real API, library version,
  or scratch container.
- Exercise only the exact call path and edge case in question.
- Stop as soon as the behavior succeeds or fails with reproducible output.

## Benchmark

Use when a design choice depends on measured latency, allocations, throughput,
or lock contention.

- Put two competing Go implementations side-by-side under identical inputs in a
  minimal `*_test.go` or `main.go` harness (`go test -bench=. -benchmem`,
  `go test -race`, or `EXPLAIN ANALYZE` driven from Go).
- Measure the smallest realistic workload that exposes the bottleneck.
- Report raw metrics and environment conditions; never extrapolate from a
  single run with no variance note.

## Shape check

Use when prose hides awkwardness in a Go interface, package boundary, HTTP
payload, or SQL schema mapping.

- Write two or three competing Go signatures, structs, or SQL mappings next to
  two realistic Go call sites or queries.
- Keep implementations stubbed or in-memory; check ergonomics, error paths, and
  type friction from the caller's side.
- Pick the winner by comparing call-site clarity and edge-case handling.

## Verdict template

Append this block to `research.md` (or the active Issue Artifact):

```md
### Spike verdict: <short topic>

- **Question:** <single empirical question>
- **Decision affected:** <spec contract, ADR, or plan boundary>
- **Branch & setup:** <Feasibility | Benchmark | Shape check; Go/dep versions>
- **Observed evidence:** <command + key output, timings, query plan, or trace>
- **Verdict:** <clear answer and constraints discovered>
- **Cleanup:** <working tree clean; spike/<slug> discarded or archived>
```
