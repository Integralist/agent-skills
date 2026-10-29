# Spec Format

Write proposed behaviour in a project spec (`projects/<slug>/spec.md`) and
current behaviour in a living spec (`docs/specs/<capability>.feature`).
Scenarios move between them without changing their meaning.

**Scenarios.** Use feature-level Gherkin: fenced `gherkin` blocks in project
Markdown, raw Gherkin in living `.feature` files. Each scenario defines an
acceptance test through a system boundary (API, CLI, handler); unit behaviour
belongs in ordinary tests. For non-code work, name the checkable assertion
(command output, file state) that proves the behaviour.

- **Declarative, not imperative.** Say what behaviour holds, not the clicks or
  calls that reach it.
- **One behaviour per scenario.** If it needs "and then also", split it.
- **Concrete and observable.** Name values and outcomes, never "works
  correctly".
- **The domain's words.** Use the terms the glossary and code use.
- Use `Background` for preconditions every scenario shares, and
  `Scenario Outline` with `Examples` for one behaviour across inputs.

**Living spec.** Write one `Feature:` per `.feature` file, named for the
capability rather than a delivery slice. Put concise purpose and domain
context beneath `Feature:` or `Rule:`. Descriptions do not test requirements;
express every enforceable contract or invariant in scenarios.
Leave out project metadata, Markdown headings, and code fences.

```gherkin
Feature: {capability}
  {Brief purpose and domain context.}

  Scenario: {one required behaviour}
    Given {a relevant starting state}
    When {an actor takes an action}
    Then {an observable outcome or required guarantee holds}
```

**One executable source.** Acceptance runners load the living `.feature`
files directly. Keep step implementations and fixtures beside the test code;
avoid package-local copies of the same scenarios. Select each suite's owned
features and fail on empty selections, undefined steps, or pending steps.
Project scenarios and deltas are proposal or historical snapshots, not a
second current contract. Structural validation is not proof of Gherkin syntax
or passing acceptance tests; use the project's runner to parse and verify it.
Record any required checks that cannot run as verification gaps.

**Placement and lifecycle.** Keep the change's problem, solution, scope, and
rationale in the project spec; put lasting operational instructions in a
README or runbook and durable architectural rationale in an ADR. Link these
from the feature description when useful. Planning identifies target living
specs without publishing unbuilt behaviour as current truth. Implementation
updates the living features and their acceptance tests together.

**Migration.** Read a legacy Markdown living spec as the baseline, then plan
its conversion with the implementation. Preserve all durable requirements:
turn normative prose into scenarios, move supporting detail to its lasting
home, and split multiple `Feature` blocks into capability files. Replace
existing test-local copies with direct loading, update current links, and
remove the superseded living Markdown. A format-only conversion preserves
behaviour; any changed behaviour needs a delta. Leave historical project
snapshots and revision-pinned references intact.

**Behavioural Delta.** When a project changes behaviour a living spec already
holds, its project spec records the change against a pinned baseline: the
behaviour accepted just before this project, not whatever the living spec says
later. Group scenarios under `### ADDED`, `### MODIFIED`, `### REMOVED`, or
`### RENAMED`. MODIFIED shows the baseline and updated scenarios; REMOVED
gives the reason and the migration. Include any `Rule` or `Background`
context needed to interpret a scenario snapshot. A new capability says the
baseline is absent and uses ADDED.

````markdown
## Behavioural Delta

- **Baseline:** `docs/specs/{capability}.feature` at `{commit}`

### MODIFIED

**Baseline:**

```gherkin
Scenario: {existing behaviour}
  Given {starting state}
  When {action}
  Then {observable outcome}
```

**Updated:**

```gherkin
Scenario: {updated behaviour}
  Given {starting state}
  When {action}
  Then {observable outcome}
```
````

**Linking.** A project spec's `## Living Specifications` section links each
existing living spec with the behaviour it owns. Write a living spec that
doesn't exist yet as inline code, not a link, because `make check-specs` fails
on broken links. When nothing durable changes, say so and point to the
relevant operational docs.
