# State modeling and invariant checks

Model complex state machines in a small scratch Python script before locking a
design, spec, plan, or bug hypothesis. Exhaustive exploration catches race
conditions, deadlocks, and illegal transitions that happy-path reviews miss,
and projects the result into a plain-language Mermaid statechart for readers.

**When to use it.** Run this check only when the system has at least one of:

- Three or more interacting lifecycle states.
- Retries, timeouts, expiry, or idempotency windows.
- Concurrent actors or out-of-order events.

Skip it for linear workflows, static configuration, or simple CRUD changes.

## Workflow

1. **Write a disposable Python model.** Create `/tmp/state-model-<id>.py`
   using only the Python standard library. Define each state as a frozen
   dataclass, each step as a pure transition returning `(action_label,
   next_state)`, and each agreed rule as an invariant returning the rule name
   when violated. Never weaken an invariant to make the model pass.
2. **Explore with bounded BFS.** Run breadth-first search from the initial
   state up to a state cap (default `500`). Continue exploring past broken
   invariants so one run surfaces multiple failures. Report:
   - Every violated invariant with its shortest trace from the start state.
   - Any non-terminal state with no outgoing transitions (deadlock).
   - Whether exploration hit the state cap (report unchecked scope as a gap).
3. **Project to a reader-facing Mermaid diagram.** Map raw state fields and
   actions to plain-English labels with no variable or code names. Collapse
   irrelevant intermediate details to keep the chart around 20 arrows or
   fewer, but never merge states that break different rules. Mark states that
   always break a rule with `:::breaks` and collapsed states where only some
   underlying states break a rule with `:::mayBreak`, with a short legend.
   Validate the diagram with [conventions-mermaid](../conventions-mermaid/SKILL.md).
4. **Feed findings back into your artifact.**
   - **PDD Design / Grilling:** Turn deadlocks and unexpected paths into open
     design questions or explicit boundaries.
   - **Specifications:** Turn every broken invariant or missed edge path into a
     Gherkin `Scenario:` in `spec.md`, and embed the chart if it helps readers.
   - **Plans:** Add missing error-handling or recovery milestones and link the
     outcome diagram per [OUTCOME-DIAGRAMS.md](./OUTCOME-DIAGRAMS.md).
   - **Debugging:** Replay each reported bug trace step-for-step as a failing
     test against real code. If the bug does not reproduce, assume the model
     is wrong until proven otherwise.
5. **Keep the script disposable.** Leave `/tmp/` scripts out of the repository;
   keep only the resulting diagram, scenarios, design decisions, or tests.

## Python BFS template

Copy and adapt this template into `/tmp/state-model-<id>.py`, then run it
with `python3`:

```python
from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class State:
    # Replace with minimal finite state fields.
    phase: str


START = State(phase="pending")
LIMIT = 500


def is_terminal(s: State) -> bool:
    return s.phase in {"paid", "failed"}


def transitions(s: State) -> list[tuple[str, State]]:
    # Return (reader-facing action label, next state) pairs.
    return []


def invariants(s: State) -> list[str]:
    # Return names of rules broken in state s.
    broken: list[str] = []
    return broken


def label(s: State) -> str:
    # Reader-facing state name; collapse noise while keeping bug distinctions.
    return s.phase.capitalize()


def explore() -> None:
    seen: dict[State, list[str]] = {START: []}
    queue: deque[State] = deque([START])
    first_break: dict[str, list[str]] = {}
    deadlocks: list[tuple[State, list[str]]] = []
    edges: set[tuple[str, str, str]] = set()
    terminals: set[str] = set()
    lbl_total: dict[str, int] = {}
    lbl_bad: dict[str, int] = {}
    lbl_rules: dict[str, set[str]] = {}
    truncated = False

    while queue:
        cur = queue.popleft()
        trace = seen[cur]
        cur_lbl = label(cur)
        lbl_total[cur_lbl] = lbl_total.get(cur_lbl, 0) + 1

        broken = invariants(cur)
        if broken:
            lbl_bad[cur_lbl] = lbl_bad.get(cur_lbl, 0) + 1
            for rule in broken:
                first_break.setdefault(rule, trace)
                lbl_rules.setdefault(cur_lbl, set()).add(rule)

        steps = transitions(cur)
        if not steps:
            if is_terminal(cur):
                terminals.add(cur_lbl)
            else:
                deadlocks.append((cur, trace))

        for action, nxt in steps:
            nxt_lbl = label(nxt)
            if cur_lbl != nxt_lbl:
                edges.add((cur_lbl, action, nxt_lbl))
            if nxt not in seen:
                if len(seen) >= LIMIT:
                    truncated = True
                    continue
                seen[nxt] = [*trace, action]
                queue.append(nxt)

    print(f"Explored {len(seen)} states (truncated={truncated})")
    for rule, trace in first_break.items():
        print(f"BROKEN {rule}: {' -> '.join(trace) or '(start)'}")
    for state, trace in deadlocks:
        print(f"DEADLOCK {state}: {' -> '.join(trace) or '(start)'}")

    fence = "`" * 3
    print(f"\n{fence}mermaid\nstateDiagram-v2")
    print(f"    [*] --> {label(START)}")
    for src, act, dst in sorted(edges):
        print(f"    {src} --> {dst}: {act}")
    for lbl in sorted(terminals):
        print(f"    {lbl} --> [*]")
    for lbl in sorted(lbl_rules):
        cls = "breaks" if lbl_bad[lbl] == lbl_total[lbl] else "mayBreak"
        print(f"    class {lbl} {cls}")
    print("    classDef breaks fill:#fdecea,stroke:#c62828")
    print("    classDef mayBreak fill:#fff8e1,stroke:#f9a825")
    print(fence)


if __name__ == "__main__":
    explore()
```

Keep Mermaid state identifiers single tokens (or use `state "Plain label" as id`
aliases) and validate the rendered chart with `mmdc` per
[conventions-mermaid](../conventions-mermaid/SKILL.md).
