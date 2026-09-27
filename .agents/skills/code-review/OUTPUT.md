# Review Output

Load "Remote PR" for PR mode or "Local" for every local mode. Add "Spec and
Plan Adherence" only when that reviewer ran.

## Remote PR

````markdown
## PR #<number> Review Summary: "<title>"

**Overall assessment:** [1-2 sentence summary]

**Subagent pass:** [complete, or incomplete with remaining work]

[If a subagent hit its turn limit, immediately follow this line with a `⚠️`
warning stating the original and retry limits and whether the retry completed.]

### Actionable Items

[Confirmed findings ordered High, Medium, Low. Include file and line, relevant
snippet, impact, and smallest viable correction.]

### Informational / No Action Needed

[Brief observations requiring no change.]

### Open Questions

[Unknowns that materially constrained the review and the evidence needed.]

### Dropped by Verification

[One line per dropped finding: `file:line` — claim — why the verifier refuted
it. Write "None" when verification dropped nothing.]
````

## Local

Use the same sections as remote PR output with this header:

````markdown
## Code Review: <branch-name or "uncommitted" or path>

- **Date:** YYYY-MM-DD HH:MM
- **Mode:** branch-diff | uncommitted | all-local | paths
- **Branch:** <branch-name>
- **Base:** <merge-base-ref> (if applicable)
- **Files reviewed:** <count>
````

## Spec and Plan Adherence

Spec conflicts and delta-sync gaps are findings: verify them and rank them in
"Actionable Items" with the rest. Present the plan categories below under
"Informational / No Action Needed" unless the user requested strict scope
enforcement:

````markdown
### Spec and Plan Adherence

**Intent documents:** `projects/<slug>/spec.md`, `docs/specs/<capability>.md`

- **Unplanned files:** ...
- **Missing implementation:** ...
- **Scope excess:** ...
- **Plan drift:** ...
````

If `--plan` was passed and no intent document was located, state "Plan
adherence: none located, skipped" once.

When actionable findings exist, offer to address them. Otherwise, end with the
assessment and open questions.
