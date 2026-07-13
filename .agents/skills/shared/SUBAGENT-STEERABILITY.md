# Subagent Steerability — When to Spawn, When Not To

Guidance for any skill that delegates work to a subagent. The
question is not "is this task big enough to delegate?" but "can
the user steer it once it starts?"

## The subagent starts blank

A subagent inherits none of this conversation — it sees only the
prompt you give it. Some harnesses spawn a subagent as a fresh CLI
invocation of themselves (e.g. `pi --print ...` over bash), where
this is absolute: no shared history, no open files, nothing but the
argument string. Make every delegating prompt self-contained — the
proposed-change list, the verified exemplar, the file paths, the
review-only constraint — because there is no ambient context to fall
back on.

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

Two subagent shapes make editing safe: **two-phase** when each edit
needs its own decision, and **verified-pattern fan-out** when the
decision is made once and mechanically repeated across files. Both
are below.

## What to do instead for editing work

Prefer, in order:

1. **Two-phase: read-only audit → interactive apply.** A
   subagent investigates and returns a *proposed-change list*
   (it edits nothing). The main thread then applies the changes
   with the user, who can veto, adjust, or stop each one. This
   keeps the parallel-scan speed of a subagent while returning
   every edit to a steerable context. See `cleanup` and
   `test-feedback` for worked examples.
1. **Verified-pattern fan-out.** When the edit is mechanical
   replication of one pattern across many independent files,
   establish and verify the pattern on a single representative case
   in the main thread, get the user's approval of that case, then
   fan out subagents to apply the identical transform to the rest.
   The user approves the pattern plus one worked example — not each
   file — so the parallelism is real and the control point survives.
   Valid only when the transform is uniform, the files are
   independent, and a reviewed exemplar exists. If a file needs
   judgment the exemplar didn't settle, it is not this pattern —
   fall back to the two-phase split. See `markdown-to-skill` and
   `go-api`.
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

## Model tier for the subagent

A subagent inherits the main model by default — often needlessly expensive.
When your harness lets you set a subagent's model, pick the cheapest tier
adequate to the task. Never hardcode a model name; the main agent chooses
within its own ecosystem.

- **Cheapest tier** — mechanical, high-recall, low-judgment: bulk file
  reads, grep/trace, drafting commit/PR/changelog prose, formatting, and
  the apply agents of a verified-pattern fan-out.
- **Mid tier** — analytical read-only reasoning: code review, security
  analysis, root-cause diagnosis.
- **Main (session) model** — engineering judgment: design, ambiguous
  debugging, and the interactive apply phase of a two-phase split.

The read-only audit phase is the natural place to spend a cheap tier; the
interactive apply stays on the main model.

Never silently downgrade work touching product-code correctness or
design/debug judgment. Disclose the downgrade at the gate that approves the
work — the verified-pattern exemplar, or a direct prompt — and let the user
veto. Mechanical, read-only, git, and docs delegation needs no prompt.
