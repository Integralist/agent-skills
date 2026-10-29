# Acceptance Tests

Run the canonical living specs in `docs/specs/<capability>.feature` end to
end under [godog](https://github.com/cucumber/godog) via `go test`, so they
execute as part of `make test` with no separate runner.

**Two altitudes, one source of truth each.** Behaviour at a system boundary
(API, CLI, HTTP handler) becomes a `.feature` file that runs as an acceptance
test. Behaviour of a single function or type stays an ordinary table-driven
test: `fields` are the Given, the call is the When, `want` is the Then.
Wrapping a unit in a `.feature` file adds a second artifact that drifts from
the test.

**Layout.** Keep runners, step implementations, and fixtures beside the
package under test. Point `godog.Options.Paths` directly at the owning living
`.feature` files, resolving paths from the test package. Name features for
capabilities, not delivery slices. Do not copy scenarios into package-local
`features/` files; project specs retain proposal and historical snapshots only.
See [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) for placement and migration.

**Fail closed.** Select the suite's owned features explicitly, not every
feature in a multi-service repository. Fail when selection yields no runnable
scenarios. Set `Strict: true` so undefined or pending steps fail the suite;
unimplemented steps return `godog.ErrPending`, not success. The runner parses
the actual living files; structural spec checks alone do not prove syntax or
behaviour.

**Wiring.** Write the step code so a newcomer can read it:

- **Beginner-facing comments.** Explain Godog concepts in the generated Go
  code, near their first use: how the runner maps Gherkin to step functions,
  what `ScenarioInitializer` registers, how `sc.Step` matches text and passes
  regex captures, how optional `context.Context` arguments work, and how step
  return values affect the scenario. Explain suite options and how shared state
  passes between steps and resets between scenarios. Explain each concept once
  so comments teach the reader without narrating every statement.
- **Scenario-local registration.** Keep all related `sc.Step` registrations in
  one `ScenarioInitializer` per feature or slice. Put `Background` steps first,
  then group steps under named `Scenario` comments in feature-file order, so a
  reader can scan each scenario's setup, action, and assertions together.
  Register shared steps once at their first use; note their reuse in later
  scenario blocks. The feature file, not registration order, controls execution.
- **Step keyword labels.** Put a block comment immediately inside every
  `.Step(` call, before the regex, naming its Gherkin keyword. Use
  `/* Given */`, `/* When  */`, `/* Then  */`, `/* And   */`, or `/* But   */`;
  pad shorter keywords so closing `*/` markers align across adjacent calls.
  For reused steps, label the keyword at their first feature-file use and
  register the pattern once. Keep the keyword out of the regex.
- **Small inline steps, named helpers.** Define short setup/action functions
  inline beside their patterns. Bind substantial setup or assertions to named
  functions or scenario-world methods; put those helpers below the initializer
  so it remains a readable map of the scenarios.

The example feature belongs in `docs/specs/withdraw-funds.feature`; the Go
runner belongs in `go/internal/myapp/acceptance_test.go`, which determines the
relative path below. The example illustrates wiring and step grouping; in a
real acceptance suite, replace the inline withdrawal arithmetic with a call
through the application boundary under test.

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
			// Paths loads the canonical contract relative to this test package.
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
