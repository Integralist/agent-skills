# Integration Tests

Integration tests validate end-to-end workflows against running services or
dependencies. They live in the `e2e/` directory and use the `e2e` build tag.

## Build Tag

Every integration test file must begin with:

```go
//go:build e2e

package e2e_test
```

## Structure

Group scenarios with subtests and use standard HTTP or service clients:

```go
//go:build e2e

package e2e_test

import (
    "net/http"
    "testing"
    "time"
)

const (
    // baseURL is the locally running stack that make test-integration starts.
    baseURL = "http://localhost:8080"
    // apiKey is the fixed key the test stack accepts, never a real credential.
    apiKey = "test-api-key"
)

// client bounds every request so a hung service fails the test instead of
// stalling the suite.
var client = &http.Client{Timeout: 10 * time.Second}

// TestE2EWorkflow runs each end-to-end scenario as a named subtest, so a
// failure points at the scenario that broke.
func TestE2EWorkflow(t *testing.T) {
    t.Run("Scenario: Complete CRUD workflow", testCRUDWorkflow)
    t.Run("Scenario: Error handling", testErrorHandling)
}
```

## Running Integration Tests

```bash
# Starts full stack and runs e2e tests
make test-integration

# Direct invocation
go test -tags=e2e ./e2e/...
```
