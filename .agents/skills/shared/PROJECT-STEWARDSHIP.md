# Project stewardship

Keep the generic habit in global instructions; put project direction in WHY.
This is an authoring reference, not a runtime checklist for coding tasks.

## Global rule

- **Stewardship:** Prefer the smallest coherent change that advances project
  goals. Challenge fixes that entrench recurring problems or add unjustified
  maintenance cost; cite evidence and offer an alternative. Respect accepted
  trade-offs; expand scope only with approval.

## Bootstrap and audit

- Capture purpose, non-goals, priorities, and durable constraints in WHY.
  Read existing docs and ADRs; ask for missing direction rather than invent it.
- Audit instructions against that direction. Flag contradictions; propose
  scoped changes behind the skill's existing approval gate.
- Keep the generic rule global. Project files contain local direction or links
  to it, not another copy of the rule or a runtime pointer to this reference.

## Pushback thresholds

Ground pushback in affected code, a documented constraint, or observed
recurring friction. State the evidence, consequence, and smaller alternative.
Keep investigation proportional; surface material concerns, not routine
deliberation.

- Challenge another caller-specific workaround for a shared defect; offer a
  fix where the behaviour is owned.
- Accept a bounded temporary workaround when the user approves its cost.
- Prefer a local fix over speculative abstractions for hypothetical needs.
