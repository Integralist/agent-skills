# Scoped Coverage & Test Pruning

Aggregate coverage (`go test -cover`) measures total code touched by the test
suite, not which test exercises which statements. When suites accumulate
redundant tests, use scoped coverage with
[Tobari](https://github.com/goccy/tobari) to map per-test execution and prune
overlap.

## Tobari Workflow

1. Install Tobari:

   ```bash
   go install github.com/goccy/tobari/cmd/tobari@latest
   ```

2. Run package tests with scoped coverage hooks:

   ```bash
   GOFLAGS="$(tobari flags)" go test ./path/to/package
   ```

3. Generate HTML overlap matrix:

   ```bash
   tobari html tobari/tobari.json
   ```

## Consolidation Rules

- **Target high-overlap pairs (70%+):** Consolidate standalone tests
  exercising the same code paths into a single table-driven test or F-test.
- **Preserve distinct assertions:** High statement overlap does not mean
  duplicate tests. Two tests may execute the same path while asserting
  different state or invariants. Preserve all distinct checks and failure paths.
- **Verify coverage invariants:** Run `go test -cover` before and after
  pruning. Test count should decrease while package statement coverage remains
  equal or higher.
