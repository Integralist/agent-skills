# Fuzz Tests and Benchmarks

Reference for randomized testing and performance measurement in Go.

## Fuzz Tests

Use fuzz tests (`testing.F`) to discover edge cases via randomized inputs on
validation, parsers, or security boundaries:

```go
func FuzzValidatePath(f *testing.F) {
    f.Add("/")
    f.Add("/api/v1")
    f.Add("/path/../traversal")

    f.Fuzz(func(t *testing.T, path string) {
        if !utf8.ValidString(path) {
            t.Skip("skipping invalid UTF-8")
        }

        result := ValidatePath(path)
        if result && !strings.HasPrefix(path, "/") {
            t.Errorf("valid path %q must start with /", path)
        }
    })
}
```

Run fuzz tests:

```bash
go test -fuzz=FuzzValidatePath -fuzztime=30s ./...
```

## Benchmarks

Use `testing.B` with `b.Loop()` (Go 1.24+) to measure hot paths and track memory
allocations:

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

Run benchmarks:

```bash
go test -bench=. -benchmem ./...
```
