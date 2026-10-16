# Spec Format

How to write behaviour in a project spec (`projects/<slug>/spec.md`) and a
living spec (`docs/specs/<capability>.md`), so both read the same and
scenarios move between them unchanged.

**Scenarios.** Write behaviour as feature-level Gherkin in a fenced code block
marked `gherkin`, never as Markdown prose, lists, or headings. Each scenario
becomes an acceptance test that runs end to end, so keep it at the system
boundary (API, CLI, handler); unit behaviour belongs in the tests. For
non-code work, each scenario names the checkable assertion (grep, command
output, file state) that proves it.

- **Declarative, not imperative.** Say what behaviour holds, not the clicks or
  calls that reach it.
- **One behaviour per scenario.** If it needs "and then also", split it.
- **Concrete and observable.** Name values and outcomes, never "works
  correctly".
- **The domain's words.** Use the terms the glossary and code use.
- Use `Background` for preconditions every scenario shares, and
  `Scenario Outline` with `Examples` for one behaviour across inputs.

**Living spec.** `docs/specs/<capability>.md` holds current behaviour. Title it
`# {Capability}`, without "Spec" or "Living Specification"; the folder already
says what it is. Keep lasting contracts, invariants, and scenarios. Leave out
project metadata such as the problem, scope, author, and dates.

**Behavioural Delta.** When a project changes behaviour a living spec already
holds, its project spec records the change against a pinned baseline: the
behaviour accepted just before this project, not whatever the living spec says
later. Group scenarios under `### ADDED`, `### MODIFIED`, `### REMOVED`, or
`### RENAMED`. MODIFIED shows the baseline and updated scenarios; REMOVED
gives the reason and the migration. A new capability says the baseline is
absent and uses ADDED.

````markdown
## Behavioural Delta

- **Baseline:** `docs/specs/{capability}.md` at `{commit}`

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
