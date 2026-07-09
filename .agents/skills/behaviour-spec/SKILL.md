---
name: behaviour-spec
description: >-
  Generate Gherkin behavioural specifications (acceptance criteria)
  for a feature or plan. Feature/boundary scenarios become
  executable godog .feature files for Go; unit-level behaviour is
  captured as Given/When/Then prose. Returns scenarios plus scaffold
  tasks for the caller's plan. Use when the user wants BDD/Gherkin
  user stories, acceptance criteria, executable specifications, or
  says /behaviour-spec.
---

# Behaviour Spec

Turn a feature description into behavioural specifications in Gherkin
(Given/When/Then): a machine-checkable definition of done expressed in
ubiquitous language shared by humans and AI.

Invoked by [`to-spec`](../to-spec/SKILL.md) for its acceptance-criteria block,
and by [`project-plan`](../project-plan/SKILL.md) for its scaffold tasks. Can
also run standalone.

## Two altitudes

**Feature / boundary → executable `.feature` files.** Behaviour observable at
an API, CLI, HTTP handler, or other system boundary. Here Gherkin pays off: the
scenarios are living documentation *and* run as acceptance tests (godog for Go).
This is the real payoff — generate runnable specs.

**Unit / functional → Given/When/Then prose only.** Behaviour of an individual
function or type. Capture it as G/W/T prose in the plan's task description, then
implement it as an ordinary table-driven Go test. Do **not** generate
`.feature` files for units.

> [!IMPORTANT]
> A Go table-driven test already *is* Given/When/Then — `fields` are the
> Given, the call under test is the When, `want` is the Then. Wrapping a unit
> in a `.feature` file plus regex step definitions creates a second artifact
> that duplicates the test and drifts from it. Keep one source of truth per
> level.

## Input

1. Invoked from another skill with a feature description and confirmed language:
   use those.

1. A spec or plan path given: read it; derive behaviours from it.

1. Otherwise prompt:

   ```txt
   What feature or behaviour should I write scenarios for, and what
   language is the implementation in?
   ```

## Writing feature-level scenarios

```gherkin
Feature: Short capability name
  As a {role}
  I want {capability}
  So that {benefit}

  Background:
    Given some shared precondition

  Scenario: One concrete behaviour
    Given a starting state
    When an action occurs
    Then an observable outcome holds
    And a second outcome holds

  Scenario Outline: Behaviour across inputs
    Given a balance of <start>
    When I withdraw <amount>
    Then my balance should be <end>

    Examples:
      | start | amount | end |
      |   100 |     30 |  70 |
      |    50 |     50 |   0 |
```

- **Declarative, not imperative.** Describe *what* behaviour is expected, not
  the UI clicks or function calls used to get there.
- **One behaviour per scenario.** If it needs "and then also", split it.
- **Ubiquitous language** — the same domain terms the plan and code use.
- `Background` for preconditions shared by every scenario; `Scenario Outline` +
  `Examples` for the same behaviour across a table of inputs.

## Go / godog wiring

When the language is Go, feature-level scenarios run under
[godog](https://github.com/cucumber/godog) via `go test`, so they execute as
part of `make test` — no separate runner. Layout: `.feature` files live in a
`features/` directory next to the package test that wires them.

```go
package myapp_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/cucumber/godog"
)

// state threads through context.Context between steps.
type balanceKey struct{}

func iHaveABalanceOf(ctx context.Context, amount int) (context.Context, error) {
	return context.WithValue(ctx, balanceKey{}, amount), nil
}

func iWithdraw(ctx context.Context, amount int) (context.Context, error) {
	balance, _ := ctx.Value(balanceKey{}).(int)
	if amount > balance {
		return ctx, fmt.Errorf("insufficient funds: have %d, want %d", balance, amount)
	}
	return context.WithValue(ctx, balanceKey{}, balance-amount), nil
}

func myBalanceShouldBe(ctx context.Context, expected int) error {
	if balance, _ := ctx.Value(balanceKey{}).(int); balance != expected {
		return fmt.Errorf("expected balance %d, got %d", expected, balance)
	}
	return nil
}

func InitializeScenario(sc *godog.ScenarioContext) {
	sc.Step(`^I have a balance of (\d+)$`, iHaveABalanceOf)
	sc.Step(`^I withdraw (\d+)$`, iWithdraw)
	sc.Step(`^my balance should be (\d+)$`, myBalanceShouldBe)
}

// TestFeatures runs every .feature under features/ as go subtests.
func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		Name:                "myapp",
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"features"},
			TestingT: t, // integrates with `go test` / `make test`
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status: feature tests failed")
	}
}
```

Unimplemented steps return `godog.ErrPending` so the suite reports them as
pending rather than passing silently. Follow
[`go-conventions`](../go-conventions/SKILL.md) and
[`go-testing`](../go-testing/SKILL.md) for surrounding Go style (not restated
here).

## Other languages

Same Gherkin, different runner:

| Language   | Runner                 |
| ---------- | ---------------------- |
| Go         | godog                  |
| JS / TS    | Cucumber.js            |
| Ruby       | Cucumber               |
| Java / JVM | Cucumber-JVM           |
| Python     | behave / pytest-bdd    |
| .NET       | Reqnroll (ex-SpecFlow) |

For a non-Go language, write the scenarios and describe the runner wiring at the
same altitude; the executable-vs-prose split is unchanged.

## Output

Return two things to the caller:

1. **Acceptance criteria block** — the feature-level `Feature`/`Scenario`
   Gherkin, ready to drop into the plan's `## Acceptance Criteria (BDD)`
   section.

1. **Scaffold tasks** — plan tasks a later implementer (e.g.
   [`next-task`](../next-task/SKILL.md)) can execute mechanically:

   - Add the runner dependency (for Go: `github.com/cucumber/godog` to
     `go.mod`).
   - Create `features/<name>.feature` with the scenarios above.
   - Add `TestFeatures` + `InitializeScenario` wiring.
   - Stub each step definition returning `godog.ErrPending`.

   Definition of done: **all scenarios pass via `make test`**.

Do not write `.feature` files into the repo yourself — emit them as scaffold
tasks so file creation stays with implementation.

## Guidelines

- Only feature/boundary behaviour becomes `.feature` files; units stay as
  Given/When/Then prose in task descriptions.
- Scenarios must be concrete and observable — no "works correctly".
- Omit needless words in step phrasing — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
- Wrap all Markdown output at 80 columns; follow the project's Markdown
  conventions (bullet lists for metadata label lines, language identifiers on
  code blocks).
