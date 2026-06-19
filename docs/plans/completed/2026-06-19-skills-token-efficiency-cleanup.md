# Skills Token-Efficiency Cleanup

- **Status**: Complete
- **Author**: Integralist
- **Created**: 2026-06-19
- **Language**: Markdown

## Summary

A review of all 37 skills in `.agents/skills/` against the principles in
[`writing-great-skills`](../../.agents/skills/writing-great-skills/SKILL.md)
(and its [`GLOSSARY.md`](../../.agents/skills/writing-great-skills/GLOSSARY.md))
surfaced a set of token-efficiency and maintainability problems: cross-skill
**duplication**, **sprawl**, repeated harness-specific boilerplate, and
inconsistent / non-standard frontmatter keys. The reference bar is the
[mattpocock/skills](https://github.com/mattpocock/skills) repo, whose
efficiency rests on a clean invocation axis, progressive disclosure, and a
strict single-source-of-truth rule across skills. This plan captures the
findings as phased, checkable work so the cleanup can be revisited and executed
incrementally. Tier 4 (frontmatter normalization) is broken out first because
it is mechanical, low-risk, and broad.

## Acceptance Criteria

This is a documentation/skill-maintenance task, not code, so acceptance is
expressed as grep-checkable assertions rather than executable Gherkin (no godog
runner applies to Markdown skills).

```gherkin
Feature: Skills frontmatter is normalized (Tier 4)

  Scenario: No skill uses the non-standard user-invocable key
    Given the .agents/skills directory
    When I run: rg -l '^user-invocable:' */SKILL.md
    Then no files are returned

  Scenario: No skill uses the non-standard when_to_use key
    Given the .agents/skills directory
    When I run: rg -l '^when_to_use:' */SKILL.md
    Then no files are returned

  Scenario: User-invoked skills retain their gating intent
    Given consensus was the only skill using when_to_use
    And when_to_use is appended to the description by the harness anyway
    When I read consensus/SKILL.md after the change
    Then its gating guidance ("only after explicit confirmation",
      and the suitable/skip lists) is merged into the description

  Scenario: markdown-to-skill description has no trigger phrasing
    Given markdown-to-skill is user-invoked (disable-model-invocation: true)
    When I read its description
    Then it is a one-line human-facing summary
    And it contains no "Use when…" / "mentions…" trigger lists

Feature: Cross-skill duplication is removed (Tier 1)

  Scenario: Git-metadata recipe has one source of truth
    Given redesign and refactor both embedded the same git recipe
    When I search both SKILL.md files for the churn/bus-factor commands
    Then the commands appear in exactly one shared reference file
    And both skills point at it rather than restating it

  Scenario: code-review does not restate go-conventions rules inline
    Given the Idiomatic Go subagent loads go-conventions
    When I read the code-review Idiomatic Go dimension
    Then it instructs loading go-conventions and flagging violations
    And it does not enumerate the individual naming/error/structure rules

Feature: project-plan delegation is conditional (Tier 2)

  Scenario: behaviour-spec and extract-doc have explicit skip criteria
    Given a plan for non-code or maintenance work
    When I read project-plan's Behavioural specs and Extract formal
      documents sections
    Then each states when to invoke the sub-skill and when to skip it
    And the skip path says what to do instead (checkable assertions /
      note the skip)

  Scenario: Gherkin user stories are kept for non-code plans
    Given a non-code plan where user stories clarify intent
    When project-plan decides about behaviour-spec
    Then it still authors Given/When/Then scenarios in the plan
    And it gates only the executable godog scaffolding, not the format

  Scenario: extract-doc can decide to produce neither document
    Given a maintenance plan with no rejected-alternative decision
      and no user-facing product surface
    When extract-doc runs Phase 1 (automatic invocation)
    Then it produces no ADR and no PRD
    And it states why neither was warranted
    And it does not emit an all-placeholder template
```

## Research

No separate research document was produced; the findings come from a direct
review in-session of:

- [`writing-great-skills/SKILL.md`](../../.agents/skills/writing-great-skills/SKILL.md)
  and [`GLOSSARY.md`](../../.agents/skills/writing-great-skills/GLOSSARY.md)
- The reference repo `mattpocock/skills` (`docs/invocation.md`, `CONTEXT.md`,
  `README.md`) reviewed via `gh`.
- All 37 local `*/SKILL.md` frontmatters, word counts, and supporting-file
  layouts; deep reads of `go-conventions`, `redesign`, `refactor`,
  `code-review`, `mysql-index-audit`, `consensus`.

## Prerequisites & Dependencies

- `rg` (ripgrep) for the checkable assertions above.
- No new tooling or libraries required.
- Standard Claude Code skill frontmatter keys (the target schema): `name`,
  `description`, `disable-model-invocation`, `allowed-tools`, `argument-hint`.
  Both keys being removed are behaviour-neutral to drop:

  - `user-invocable` **defaults to `true`**, so setting it explicitly is a
    no-op — omitting it preserves the same behaviour.
  - `when_to_use` is **appended to the `description`** by the harness, so its
    text is already part of the description's effective content; folding it
    into `description` directly is equivalent and removes the redundant key.

## Implementation Tasks

### Phase 1: Tier 4 — Frontmatter normalization (mechanical, do first)

- [x] **Task 1.1**: Remove `user-invocable: true` from all 10 skills that
  carry it.

  Affected files (verified via `rg -l '^user-invocable:' */SKILL.md`):
  `behaviour-spec`, `cleanup`, `code-review`, `decide`, `delegate`,
  `mysql-index-audit`, `project-plan`, `refactor`, `slack-search`, `tech-docs`.

  For skills that are meant to be user-only, the correct standard key is
  `disable-model-invocation: true`. Confirm each affected skill's intended
  invocation mode before deleting:

  - Skills that already have `disable-model-invocation: true` AND
    `user-invocable: true` (e.g. `cleanup`, `decide`, `delegate`,
    `mysql-index-audit`, `refactor`, `slack-search`): the `user-invocable` line
    is pure redundancy — delete it, no behaviour change.
  - Skills with `user-invocable: true` but NO `disable-model-invocation`
    (e.g. `behaviour-spec`, `code-review`, `project-plan`, `tech-docs`): decide
    explicitly whether each should be model-invoked (keep a rich trigger
    description, drop `user-invocable`) or user-invoked (add
    `disable-model-invocation: true`, strip trigger phrasing from the
    description). Default: these four have rich model-facing descriptions and
    are reached by other skills (e.g. `project-plan` is called by
    `research-plan`; `behaviour-spec` by `project-plan`) — so they should stay
    **model-invoked**: just delete `user-invocable`.

- [x] **Task 1.2**: Remove `when_to_use:` from `consensus/SKILL.md`, preserving
  its content.

  `consensus` is the only skill using `when_to_use` (verified). The harness
  **appends `when_to_use` to the `description`**, so the text is already part
  of the effective description — folding it into `description` directly is
  equivalent, not a relocation that changes meaning. Merge the gating intent
  ("Only after the user has explicitly confirmed it… Skip for typos,
  single-line fixes…") into the `description` field, then delete the
  `when_to_use` key. Do not silently drop the suitable/skip lists.

- [x] **Task 1.3**: Rewrite `markdown-to-skill`'s description to drop trigger
  phrasing.

  Current: `Convert Markdown files from a directory into agent skills. Use when
  the user wants to bulk-convert documentation or guides into reusable skills.`
  The skill is user-invoked (`disable-model-invocation: true`), so its
  description is human-facing only — the "Use when the user wants…" clause is a
  **no-op** (no agent reads it). Reduce to a one-line summary, e.g.:
  `Convert Markdown files from a directory into agent skills.`

- [x] **Task 1.4**: Sweep for any other user-invoked skill whose description
  still carries model-facing trigger phrasing ("Use when…", "mentions…",
  "asks for…", "or says /…") and strip it to a one-liner. Candidates to check:
  all 16 skills with `disable-model-invocation: true`.

### Phase 2: Tier 1 — Cross-skill duplication (highest payoff)

- [x] **Task 2.1**: Extract the shared git-metadata recipe used by `redesign`
  and `refactor` into one reference file, and point both skills at it.

  Both skills embed byte-identical "Gather project metadata" blocks (churn
  hotspots, bus factor, bug clusters, commit velocity, crisis patterns,
  cross-reference). This violates **single source of truth**. Create a shared
  reference (e.g. `.agents/skills/<shared>/GIT-METADATA.md` or a sibling file
  owned by one skill) and replace both inline blocks with a prose pointer.
  Decide ownership: simplest is a small dedicated reference file both invoke.

- [x] **Task 2.2**: Extract the shared "Surface durable rules" 5-step process
  (also duplicated in `redesign` and `refactor`) into the same shared reference
  and point both at it.

- [x] **Task 2.3**: Remove the inline go-conventions rule restatement from
  `code-review`.

  Lines ~203-218 of `code-review/SKILL.md` re-list go-conventions rules
  (naming / error-handling / structure / observability / layers) inside the
  Idiomatic Go subagent prompt — while the same subagent is already told to
  load `go-conventions/SKILL.md`. This is **duplication** of another skill's
  single source of truth and a staleness trap (go-conventions changes
  frequently). Replace with: "load `go-conventions`, then flag changed Go that
  violates its rules." Keep the Effective Go pointer.

### Phase 3: Tier 2 — Sprawl & progressive disclosure

- [x] **Task 3.1**: Trim `go-conventions` Constructors section.

  "When to skip a constructor", the ascii "Decision flow" tree, and "When to
  use each pattern" restate the same decision three times (**duplication**).
  Collapse to one authoritative treatment.

- [x] **Task 3.2**: Disclose `go-conventions` deep reference tables behind
  pointers.

  The linter-suppression directive matrix and the large stdlib-preference
  tables are consulted rarely; pushing them to a sibling file (progressive
  disclosure) keeps the top of the skill legible. Verify each move preserves a
  clear pointer so the material is still reachable.

- [x] **Task 3.3** (optional / borderline): In `mysql-index-audit`, push the
  "Reference: reading EXPLAIN" section behind a pointer — it is only needed at
  the EXPLAIN follow-up step, not during the static audit.

- [x] **Task 3.4**: Make `project-plan`'s delegation to `behaviour-spec` and
  `extract-doc` **conditional**, with explicit skip criteria.

  Today both delegations are written as unconditional steps: the
  `## Behavioural specs` section says "Delegate to the `behaviour-spec`
  skill…", and the `## Extract formal documents` section says "Immediately
  after the plan is written, delegate to the `extract-doc` skill…". Neither
  says when *not* to. This forced a manual judgment call when planning this
  very cleanup (a Markdown skill-maintenance task): executable Gherkin/godog
  does not apply to non-code work, and a frontmatter cleanup does not warrant
  an ADR/PRD. The skill should make that call for the agent rather than
  leaving it implicit.

  Add a short gate to each section so the agent decides predictably. Suggested
  shape:

  - **`behaviour-spec`** — separate two things the current section conflates:
    the **Gherkin user-story format** (Given/When/Then scenarios that summarise
    intent and expected behaviour) from the **executable godog machinery**
    (`.feature` files, the runner dependency, step-definition stubs).
    - **Keep Gherkin scenarios whenever they clarify the plan's intent** —
      *including non-code plans*. A documentation, config, or maintenance plan
      still benefits from high-level Given/When/Then describing the expected
      outcome (this very plan does exactly that). Do **not** drop user stories
      merely because there is no Go/code under discussion.
    - **Only add the executable godog scaffolding** (and the runner dependency,
      `.feature` files, step defs) when the plan describes runnable code whose
      behaviour can actually be executed as tests. For non-code plans, write the
      scenarios as **prose Gherkin acceptance criteria** that are verified by
      directly checkable assertions (grep/command/file-state), and note that the
      executable scaffolding was skipped — but the scenarios stay.
    - So the gate is on the *executable machinery*, not on the *format*. The
      full `behaviour-spec` delegation (which produces scaffold tasks) is what
      gets skipped for non-code work; the Gherkin scenarios themselves are
      authored inline either way.
  - **`extract-doc`** — invoke when the plan contains a genuine architecture
    decision (ADR) or product/requirements framing (PRD). Skip when the plan is
    a mechanical or maintenance change with no decision or product surface, and
    note the skip in the plan.

  Keep the additions tight — a sentence or two per section, in the skill's
  existing voice. The goal is a clear **completion criterion** for "should I
  delegate here?", not a new branch of process.

- [x] **Task 3.5**: Give `extract-doc` a "produce neither" path so it stops
  forcing an ADR/PRD when the source plan does not warrant one.

  `extract-doc`'s Phase 1 (`extract-doc/SKILL.md:32-58`) only decides between
  **PRD**, **ADR(s)**, or **both** — there is no "neither" outcome. Its signals
  are presence-based ("describes a user-facing feature", "records a technical
  decision"), so almost any plan trips at least one and the skill always emits
  a document. This is the inverse of the Task 3.4 problem: where `project-plan`
  over-delegates *into* this skill, this skill then over-produces. The two
  should agree on the same bar.

  Add an explicit **value gate** to Phase 1, ahead of the PRD/ADR/both
  decision:

  - Define what makes each document *worth* producing, not merely *matchable*:
    - An **ADR** is useful only when the plan records a **genuine decision with
      a real alternative that was rejected for a reason** — a fork that
      constrains future work. Mechanical/maintenance changes, single-obvious-way
      tasks, and "just do X" plans have no decision to capture.
    - A **PRD** is useful only when there is a **product/user surface with
      goals or success criteria** worth framing independently of the plan.
      Internal refactors, tooling, and docs work have no product surface.
  - If the plan clears neither bar, the skill must **produce nothing**, state
    *why* ("no architectural decision with a rejected alternative; no
    user-facing product surface"), and stop — rather than padding a template
    with `_Not specified in source._` placeholders (the existing Guidelines
    already treat missing content as a smell; an all-placeholder document is
    the signal the doc should not exist).
  - Keep the bar consistent with Task 3.4's `extract-doc` skip criteria so
    `project-plan` and `extract-doc` do not disagree about when a formal doc is
    warranted.

  > [!NOTE]
  > When `extract-doc` is invoked **directly by the user** (`/extract-doc`),
  > treat that as intent and lower the bar — still skip a document only if it
  > would be entirely placeholder, but do not refuse a borderline case the user
  > explicitly asked for. The strict gate is primarily for **automatic**
  > invocation from `project-plan` / `research-plan`.

### Phase 4: Tier 3 — Repeated harness boilerplate

- [x] **Task 4.1**: Collapse the duplicated "Agent teams (if your harness
  supports it)" + `settings.json` snippet.

  It appears verbatim in `code-review`, `refactor`, `mysql-index-audit` (sweep
  for others). It is Claude-specific copy-paste, against the repo's
  harness-agnostic convention. Replace each with a one-line generic pointer, or
  a single shared reference file invoked where needed.

### Phase N-1: Documentation

- [x] **Task (N-1).1**: If a shared reference file is introduced (Tasks 2.1,
  2.2, 4.1), ensure it is discoverable — note it where skills are indexed
  (repo README / skills listing) if such an index exists.

### Phase N: Verification

- [x] **Task N.1**: Run the Tier 4 assertions:
  `rg -l '^user-invocable:' */SKILL.md` and
  `rg -l '^when_to_use:' */SKILL.md` — both must return nothing.
- [x] **Task N.2**: Confirm `markdown-to-skill` description is a single
  human-facing line with no trigger phrasing.
- [x] **Task N.3**: Confirm `consensus` gating intent survives in its
  `description`.
- [x] **Task N.4**: Grep `redesign` and `refactor` for the churn command
  (`git log --format=format: --name-only`) — it must appear in exactly one
  shared file, not both skills.
- [x] **Task N.4b**: Confirm `project-plan` (Task 3.4) and `extract-doc`
  (Task 3.5) state the **same** bar for when a formal doc is warranted, so the
  two skills do not disagree.
- [x] **Task N.5**: Lint all edited Markdown per `markdown-conventions`
  (mdformat + markdownlint), 80-column wrap.
- [x] **Task N.6**: Spot-check that every edited skill still parses (valid
  frontmatter, name unchanged) and that no pointer references a missing file.

## File Changes

| File                                          | Change                                                            |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `behaviour-spec/SKILL.md`                     | Remove `user-invocable`                                           |
| `cleanup/SKILL.md`                            | Remove `user-invocable` (keeps `disable-model-invocation`)        |
| `code-review/SKILL.md`                        | Remove `user-invocable`; strip inline go-conventions restatement; collapse Agent-teams block |
| `decide/SKILL.md`                             | Remove `user-invocable`                                           |
| `delegate/SKILL.md`                           | Remove `user-invocable`                                           |
| `mysql-index-audit/SKILL.md`                  | Remove `user-invocable`; collapse Agent-teams block; (opt) disclose EXPLAIN reference |
| `refactor/SKILL.md`                           | Remove `user-invocable`; point at shared git-metadata + durable-rules; collapse Agent-teams block |
| `slack-search/SKILL.md`                       | Remove `user-invocable`                                           |
| `tech-docs/SKILL.md`                          | Remove `user-invocable`                                           |
| `consensus/SKILL.md`                          | Remove `when_to_use`; move gating intent into body               |
| `markdown-to-skill/SKILL.md`                  | Rewrite description to drop trigger phrasing                      |
| `redesign/SKILL.md`                           | Point at shared git-metadata + durable-rules references          |
| `go-conventions/SKILL.md`                     | Trim triple constructor section; disclose deep tables            |
| `project-plan/SKILL.md`                       | Remove `user-invocable`; gate `behaviour-spec` + `extract-doc` delegation with skip criteria (Task 3.4) |
| `extract-doc/SKILL.md`                        | Add a "produce neither" value gate to Phase 1 so it skips ADR/PRD when the plan warrants none (Task 3.5) |
| `<shared reference file(s)>`                  | New: git-metadata recipe, durable-rules process, (opt) Agent-teams note |

## Parallel Execution

The tiers are largely independent and can be split across subagents, with one
ordering constraint: Tier 4 (Phase 1) is purely frontmatter and touches some of
the same files as later phases, so it should land first to avoid edit conflicts
on shared files (`code-review`, `refactor`, `mysql-index-audit`).

### Subagent Roles

| Subagent Role          | Responsibility                                              |
| ---------------------- | ----------------------------------------------------------- |
| Frontmatter normalizer | Phase 1 (Tier 4) across all affected skills                 |
| Duplication surgeon    | Phase 2 (Tier 1) — shared extractions + code-review trim    |
| Sprawl/disclosure      | Phase 3 (Tier 2) — go-conventions + mysql-index-audit       |
| Boilerplate collapser  | Phase 4 (Tier 3) — Agent-teams blocks                       |

### Work Streams

**Stream 1 — Frontmatter (Tier 4)** (frontmatter normalizer)

- Task 1.1, 1.2, 1.3, 1.4

**Stream 2 — Duplication (Tier 1)** (duplication surgeon)

- Task 2.1, 2.2, 2.3

**Stream 3 — Sprawl (Tier 2)** (sprawl/disclosure)

- Task 3.1, 3.2, 3.3

**Stream 4 — Boilerplate (Tier 3)** (boilerplate collapser)

- Task 4.1

### Synchronization Points

| Sync Point                       | Blocked Stream | Waiting On |
| -------------------------------- | -------------- | ---------- |
| Frontmatter edits land first     | 2, 3, 4        | 1          |
| Shared git-metadata file created | 4 (if reusing) | 2 (Task 2.1) |

> [!NOTE]
> Streams 2 and 4 both touch `code-review`, `refactor`, and
> `mysql-index-audit`. If running in parallel, coordinate on those three files
> or serialize the overlapping edits to avoid conflicts.

## Notes & Caveats

- **Both frontmatter-key removals are behaviour-neutral** (confirmed):
  `user-invocable` defaults to `true` so omitting it changes nothing, and
  `when_to_use` is appended to the `description` so folding its text into
  `description` is equivalent.
- **Invocation-mode decisions in Task 1.1 are judgment calls**, not mechanical.
  The four skills lacking `disable-model-invocation` (`behaviour-spec`,
  `code-review`, `project-plan`, `tech-docs`) need an explicit keep-model-invoked
  vs make-user-invoked decision; the default recommendation is keep
  model-invoked (they are reached by other skills, which user-invoked skills
  cannot be).
- **Skills deliberately left alone** (already tight / well-disclosed):
  `handoff`, `grill-me`, `grepai`, `delegate`, `caveman`, `test-feedback`,
  `grill-with-docs`, `teach`.
- This plan skipped `behaviour-spec` (executable Gherkin) and `extract-doc`
  (ADR/PRD) delegation that `project-plan` normally performs: the work is
  Markdown skill-maintenance, godog does not apply, and a frontmatter cleanup
  does not warrant an ADR/PRD. That skip was a manual judgment call because
  `project-plan` delegates to both unconditionally — Task 3.4 fixes the skill
  so the decision is made for the agent next time.
