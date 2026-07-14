# Review Output

Load "Remote PR" for PR mode or "Local" for every local mode. Add "Plan
Adherence" only when `--plan` was requested.

## Remote PR

```markdown
## PR #<number> Review Summary: "<title>"

**Overall assessment:** [1-2 sentence summary]

### Actionable Items

[Confirmed findings ordered High, Medium, Low. Include file and line, relevant
snippet, impact, and smallest viable correction.]

### Informational / No Action Needed

[Brief observations requiring no change.]

### Open Questions

[Unknowns that materially constrained the review and the evidence needed.]
```

## Local

Use the same sections as remote PR output with this header:

```markdown
## Code Review: <branch-name or "uncommitted" or path>

- **Date:** YYYY-MM-DD HH:MM
- **Mode:** branch-diff | uncommitted | all-local | paths
- **Branch:** <branch-name>
- **Base:** <merge-base-ref> (if applicable)
- **Files reviewed:** <count>
```

## Plan Adherence

Present plan findings under "Informational / No Action Needed" unless the user
requested strict scope enforcement:

```markdown
### Plan Adherence

**Plan:** `docs/plans/<slug>.md`

- **Unplanned files:** ...
- **Missing implementation:** ...
- **Scope excess:** ...
- **Plan drift:** ...
```

If no plan was located, state "Plan adherence: no plan located, skipped" once.

When actionable findings exist, offer to address them. Otherwise, end with the
assessment and open questions.
