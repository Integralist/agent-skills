---
name: conventions-acceptance-tests
description: >-
  Acceptance-test conventions for Go/Godog and Make/Bash workflows. Use when
  creating, editing, or reviewing feature-driven acceptance suites, step
  definitions, runners, or shell workflow tests.
metadata:
  model-tier: moderate
---

# Acceptance Test Conventions

Write acceptance tests that read like the feature they prove. A reader should
find a scenario, its steps, and the code behind each step without reconstructing
the test harness. Apply the language's conventions too; this skill sets the
acceptance-test structure, not general Go or shell style.

**One contract.** Prefer Godog for feature-driven acceptance tests, including
Make/Bash workflows. Keep an established alternative Gherkin runner unless
migration is requested. Load the canonical `docs/specs/<capability>.feature`
files directly; keep step implementations and fixtures by the test code.
Select the suite's owned features and fail on empty selections, undefined
steps, or pending steps. Keep single-function behaviour in ordinary unit
tests. Read [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) for placement and
migration, and [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md) for assertions.

**Mirror the feature.** Put shared `Background` registrations first, then
organize scenario groups in feature-file order, using the exact `Rule` and
`Scenario` titles as comments. Keep step wording recognizable in patterns and
helper names; preserve Given/When/Then order inside each group. Register shared
steps once at their first use and note reuse in later groups, so readers can
follow each scenario without duplicate or overlapping patterns. Keep Scenario
Outlines parameterized rather than copying the same code for each row.

**Visible steps.** Keep short setup, actions, and assertions inline beside
their patterns. Bind substantial work to named helpers or scenario-world
methods below the initializer, grouped in the same order where practical.
Extract transport, process, and fixture mechanics, not the whole scenario
behind a generic helper. Reuse serves the scenario's readability, not the other
way around.

**Prove each step.** A Given establishes or verifies its stated condition, a
When exercises the real boundary, and a Then checks the promised result or
guarantee. If shared setup already supplies a condition, verify that fact
rather than register a successful no-op. Unimplemented steps stay pending and
fail the suite. Stub external dependencies, not the behaviour being accepted;
observe real dependency calls only when the contract requires them. For
absence claims, verify the request or command reached the subject before
asserting that nothing happened.

**Fresh scenarios.** Create or reset scenario state before each scenario or
in its Background, not by relying on a previous scenario. Give each scenario
its own workspace, dependency observations, and resources; clean them up
after each run, including when an assertion fails. Bound requests, commands,
and readiness waits. Use observable readiness signals rather than fixed
sleeps, and enable parallelism only when the resources and observations are
isolated.

**Go/Godog.** Keep each initializer scoped to a feature or cohesive capability.
Registration declares step mappings; Gherkin, not registration order, controls
which steps run. Set `Strict: true` and return `godog.ErrPending` for unfinished
steps so they cannot silently pass. Put `/* Given */`, `/* When  */`,
`/* Then  */`, `/* And   */`, or `/* But   */` immediately inside each `.Step(`
call, before the pattern, with aligned closing markers. Label reused steps by
their first feature-file use; the keyword is not part of the regex. Explain
Godog concepts once at first use: step matching and captures, optional context
arguments and returned state, return values, suite options, and scenario setup
and cleanup. Read [ACCEPTANCE.md](../go-testing/ACCEPTANCE.md) for a runnable
wiring example.

**Make/Bash.** Go/Godog steps invoke real targets or scripts and verify their
effects, keeping setup, action, and assertions visible under each scenario
name. Use temporary workspaces and control external dependencies through
their normal interfaces. Keep shell helpers for fixtures and command
mechanics, not as a separate acceptance framework. Read [SHELL.md](SHELL.md)
for the command-step example, outcome checks, and process cleanup.

**Verify.** Run the project's Make test target and confirm every selected
scenario has implemented steps. Demonstrate that a deliberately violated
contract fails its assertion, not compilation or setup; restore the change
and rerun. Check missing and unimplemented scenarios fail when wiring a new
runner. Report anything not exercised as a verification gap.
