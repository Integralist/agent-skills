# Godog Wiring

Run living `.feature` contracts under
[godog](https://github.com/cucumber/godog) via `go test` and the project's Make
test target. Load the
[acceptance-test conventions](../conventions-acceptance-tests/SKILL.md) for
scenario-to-code structure, isolation, and step assertions; this document is
the Go wiring example.

Keep living features at `docs/specs/<capability>.feature`. Place the runner
and steps according to the project's existing test layout. The package name
and concrete path below are illustrative, not required; resolve the feature
path from the actual test package. The example illustrates wiring and step
grouping; in a real suite, replace the inline withdrawal arithmetic with a
call through the application boundary under test.

```gherkin
Feature: Withdraw funds
  Background:
    Given I have a balance of 100

  Scenario: Withdraw some funds
    When I withdraw 30
    Then my balance should be 70

  Scenario: Withdraw the entire balance
    When I withdraw 100
    Then my account should be empty
```

```go
package myapp_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/cucumber/godog"
)

// balanceKey identifies the balance shared between steps in one scenario.
// Godog starts each scenario with its own context; a step's returned context
// is passed to later steps, so balance changes stay within that scenario.
type balanceKey struct{}

// TestFeatures runs the living contract as Go subtests. Godog reads its steps
// and calls the matching Go function registered by InitializeScenario.
func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		// Name labels output; it does not select feature files.
		Name: "myapp",
		// ScenarioInitializer registers the functions that implement steps.
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			// Format controls console output; "pretty" shows readable steps.
			Format: "pretty",
			// Paths selects the owning feature; adapt this illustrative path.
			Paths: []string{"../../../docs/specs/withdraw-funds.feature"},
			// Strict makes undefined and pending steps fail instead of passing.
			Strict: true,
			// TestingT reports scenarios through go test / make test.
			TestingT: t,
		},
	}
	// RetrieveFeatures parses the same files without running their steps.
	features, err := suite.RetrieveFeatures()
	if err != nil {
		t.Fatalf("load living feature: %v", err)
	}
	// Pickles are runnable scenarios, including each Scenario Outline row.
	if len(features) != 1 || len(features[0].Pickles) == 0 {
		t.Fatal("expected one living feature with runnable scenarios")
	}
	// Run returns a status code; non-zero makes the Go test fail too.
	if suite.Run() != 0 {
		t.Fatal("non-zero status: feature tests failed")
	}
}

// InitializeScenario registers related steps together, in feature-file order.
// sc.Step matches the text after Given/When/Then/And; the keyword does not
// affect matching. ^ and $ anchor the regex to the whole sentence.
// Capture groups become function arguments; (\d+) is converted to an int here.
// Godog supplies context.Context when requested as the first argument.
// Returning nil passes a step; an error stops the scenario's remaining steps.
// Registration builds a lookup table; the feature file decides execution order.
func InitializeScenario(sc *godog.ScenarioContext) {
	// Background: runs before every scenario, setting a fresh starting balance.
	sc.Step(/* Given */ `^I have a balance of (\d+)$`,
		func(ctx context.Context, amount int) (context.Context, error) {
			return context.WithValue(ctx, balanceKey{}, amount), nil
		},
	)

	// Scenario: Withdraw some funds
	sc.Step(/* When  */ `^I withdraw (\d+)$`,
		func(ctx context.Context, amount int) (context.Context, error) {
			balance, _ := ctx.Value(balanceKey{}).(int)
			if amount > balance {
				return ctx, fmt.Errorf("insufficient funds: have %d, want %d",
					balance, amount)
			}
			return context.WithValue(ctx, balanceKey{}, balance-amount), nil
		},
	)
	sc.Step(/* Then  */ `^my balance should be (\d+)$`, myBalanceShouldBe)

	// Scenario: Withdraw the entire balance
	// Reuses the Background and "I withdraw ..." steps registered above.
	sc.Step(/* Then  */ `^my account should be empty$`,
		func(ctx context.Context) error {
			return myBalanceShouldBe(ctx, 0)
		},
	)
}

// myBalanceShouldBe checks the observable result for both withdrawal scenarios.
func myBalanceShouldBe(ctx context.Context, expected int) error {
	if balance, _ := ctx.Value(balanceKey{}).(int); balance != expected {
		return fmt.Errorf("expected balance %d, got %d", expected, balance)
	}
	return nil
}
```
