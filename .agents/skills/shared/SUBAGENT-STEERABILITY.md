# Subagent Steerability — When to Spawn, When Not To

Guidance for any skill that delegates work to a subagent. The
question is not "is this task big enough to delegate?" but "can
the user steer it once it starts?"

## The rule

Split tasks by whether the subagent **edits the workspace**:

- **Read-only work** (find, trace, review, audit, research,
  diagnose, think) — safe to delegate to a fire-and-forget
  subagent. The user consumes the result at the end; there is
  nothing to steer mid-flight. A background or parallel subagent
  is a good fit here.
- **Editing or iterative work** (refactor, multi-step
  implementation, fixing code) — do **not** delegate to a sealed
  subagent. A subagent the user can't interrupt ploughs ahead
  while objections pile up, leaving a large diff to unwind at the
  end. The user's "I don't like this, change it" never reaches a
  subagent that isn't the main agent.

## What to do instead for editing work

Prefer, in order:

1. **Two-phase: read-only audit → interactive apply.** A
   subagent investigates and returns a *proposed-change list*
   (it edits nothing). The main thread then applies the changes
   with the user, who can veto, adjust, or stop each one. This
   keeps the parallel-scan speed of a subagent while returning
   every edit to a steerable context. See `cleanup` and
   `test-feedback` for worked examples.
1. **A chat-able named teammate** (if the harness supports agent
   teams) — a delegate the user can talk to directly mid-flight,
   rather than a fire-and-forget dispatch. See
   [`AGENT-TEAMS.md`](./AGENT-TEAMS.md).
1. **Keep it in the main thread.** When neither of the above
   applies, do the editing work inline rather than sealing it in
   a subagent.

## When a subagent reviews instead of edits

If a skill spawns subagents purely to review, critique, or
verify — and the main thread owns all implementation — say so
explicitly in the subagent prompt: *review-only; do not modify
code or run tools that change state.* This is the pattern in
`consensus`, `code-review`, `redesign`, and `decide`, and it is
why those skills need no steering gate.
