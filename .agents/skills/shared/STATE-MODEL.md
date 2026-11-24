# State modeling and invariant checks

For non-trivial state machines, write a disposable Python stdlib script to
exhaustively explore reachable states before locking a design, spec, plan, or
bug hypothesis. Skip for linear workflows, static config, or simple CRUD.

**When to use it:** Three or more interacting lifecycle states, retries /
timeouts / expiry / idempotency windows, or concurrent / out-of-order actors.

## Rules

1. **Disposable stdlib model:** Keep the scratch script outside the repo (e.g.
   `/tmp/`). Model minimal finite state (hashable/frozen), pure transitions
   returning `(action, next_state)`, and agreed invariants. Never weaken an
   invariant to make the model pass.
2. **Bounded BFS exploration:** Explore breadth-first with a finite state cap
   (e.g. 500–2,000 states). Keep exploring past broken invariants so one run
   surfaces multiple failures.
3. **Consistent report:** Print `states_explored`, whether `state_cap` was
   reached (report any truncation as unchecked scope), every broken invariant
   with its shortest action trace, and any non-terminal state with no outgoing
   transitions (deadlock).
4. **Feed findings back into the artifact:**
   - **Design / Grilling:** Turn deadlocks and illegal paths into open
     questions or explicit boundaries.
   - **Specs:** Turn broken invariants and missed edge paths into Gherkin
     scenarios in `spec.md`.
   - **Plans:** Add missing recovery milestones (and link outcome diagrams per
     [OUTCOME-DIAGRAMS.md](./OUTCOME-DIAGRAMS.md) when helpful).
   - **Debugging:** Replay each reported bug trace as a failing test against
     real code. If it does not reproduce, assume the model is wrong until
     proven otherwise.
5. **Optional visual projection:** When readers benefit from a statechart,
   project the explored graph to plain-English Mermaid `stateDiagram-v2`
   (collapsed without merging states that break different rules, marking
   failing states red and states that can reach them amber) and read and
   follow [conventions-mermaid](../conventions-mermaid/SKILL.md) to validate
   it.
