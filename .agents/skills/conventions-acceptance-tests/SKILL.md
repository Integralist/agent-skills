---
name: conventions-acceptance-tests
description: >-
  Acceptance-test conventions for Go/Godog and Make/Bash workflows. Use when
  creating, editing, or reviewing feature-driven acceptance suites, step
  definitions, runners, or shell workflow tests.
metadata:
  model-tier: moderate
---

Write acceptance tests that read like the feature they prove. This skill sets
scenario structure, not general Go or shell style; apply the language's
conventions too.

**Default.** Prefer Godog for feature-driven acceptance tests, including
Make/Bash workflows. Keep an established alternative Gherkin runner unless
migration is requested. Load canonical `docs/specs/<capability>.feature` files
directly, keep step implementations and fixtures by the test code, and select
the suite's owned features. Empty selections, undefined steps, and pending
steps must fail. Test single-function behaviour with ordinary unit tests.

**Before writing.** Read [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) for feature
placement and migration, and [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md)
for assertions. For Go/Godog wiring, also read
[ACCEPTANCE.md](../go-testing/references/ACCEPTANCE.md). For Make/Bash workflow tests,
read [SHELL.md](references/SHELL.md) before implementing command steps.

**Make the code follow the feature.** Register shared `Background` steps
first. Then group scenarios in feature-file order, with exact `Rule` and
`Scenario` titles as comments. Keep step wording recognizable in patterns and
helper names, preserve Given/When/Then order, register shared steps once at
first use, and note later reuse. Keep Scenario Outlines parameterized.

**Keep each step visible.** Put short setup, actions, and assertions beside
their patterns. Put substantial work in named helpers or scenario-world
methods below the initializer, grouped in scenario order where practical.
Extract transport, process, and fixture mechanics—not entire scenarios behind
generic helpers. Reuse should make the scenario easier to read.

**Prove the stated contract.** A Given establishes or verifies its condition,
a When exercises the real boundary, and a Then checks the promised result or
guarantee. If shared setup already establishes a condition, verify it rather
than register a successful no-op. Leave unfinished steps pending so the suite
fails. Stub external dependencies, not accepted behaviour; observe real
calls only when the contract requires them. Before asserting that no call
occurred, prove the intended request or command reached the subject.

**Isolate scenarios.** Create or reset state for each scenario or in its
Background. Give each scenario its own workspace, dependency observations,
and resources; clean them up even after assertion failures. Bound requests,
commands, and readiness waits. Use observable readiness, not fixed sleeps.
Enable parallelism only when resources and observations are isolated.

## Go/Godog

Scope each initializer to a feature or cohesive capability. Registration maps
steps; Gherkin controls execution order. Set `Strict: true` and return
`godog.ErrPending` for unfinished steps. Put `/* Given */`, `/* When  */`,
`/* Then  */`, `/* And   */`, or `/* But   */` immediately inside every
`.Step(` call, before its pattern, with closing markers aligned. Mark a reused
step at its first feature-file use; the keyword is not part of its regex.

Explain Godog concepts once at first use: matching and captures, optional
context arguments and returned state, return values, suite options, and
scenario setup and cleanup. The runnable wiring example is in
[ACCEPTANCE.md](../go-testing/references/ACCEPTANCE.md).

## Make/Bash

Go/Godog steps run real Make targets or scripts and verify their effects.
Keep setup, action, and assertion visible under each scenario name. Use
isolated temporary workspaces and control external dependencies through their
normal interfaces. Helpers are for fixtures and command mechanics, not a
separate acceptance framework. See [SHELL.md](references/SHELL.md) for command steps,
outcome checks, and process cleanup.

## Verify

Run the project's Make test target. Confirm every selected scenario has
implemented steps. Deliberately violate a contract and show that its assertion
fails—not compilation or setup—then restore the change and rerun. When wiring
a runner, check that missing features and unimplemented steps fail. Report
anything not exercised as a verification gap.
