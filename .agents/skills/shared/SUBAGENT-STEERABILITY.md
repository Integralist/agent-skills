# Subagent Steerability — When to Spawn, When Not To

Delegate based on whether the user needs to steer work mid-flight, not just
whether a task looks large.

## Subagents start blank

A subagent sees only the prompt you give it—no conversation history, no open
files. Make every prompt self-contained: assigned scope, exact file paths,
constraints (such as *review-only; do not modify code or state*), and required
outputs.

## Read-only vs. editing

- **Read-only work** (search, trace, audit, review, research, diagnose) is
  safe to run in background or parallel subagents—there is nothing to steer
  mid-flight.
- **Editing or iterative work** must stay steerable. Do not seal multi-step
  edits inside a fire-and-forget subagent. Instead, pick the right shape:
  1. **Two-phase (audit → interactive apply):** Subagents investigate
     read-only and return proposed changes; the main thread applies them with
     the user.
  2. **Verified-pattern fan-out:** For uniform, independent mechanical edits
     across many files, verify one exemplar with the user in the main thread,
     then fan out subagents to replicate that exact pattern. Fall back to
     two-phase if any file needs new judgment.
  3. **Chat-able teammate** (when supported; see [`AGENT-TEAMS.md`](./AGENT-TEAMS.md))
     or **keep it in the main thread**.

## Model tiers

Never hardcode model IDs—choose within the active ecosystem by what a miss
would cost:

- **Cheapest tier:** Mechanical, high-recall work (bulk reads, grep/trace,
  drafting git/PR/changelog prose, formatting, fan-out apply).
- **Mid tier:** Read-only analysis checked before action (research summaries,
  first-pass triage).
- **Main (session) model or better:** Engineering judgment (code review,
  security, root-cause diagnosis, design, ambiguous debugging, interactive
  apply).

Never silently downgrade product-code correctness or design/debug judgment—
disclose at the approval gate so the user can veto. Mechanical, read-only,
git, and docs delegation needs no prompt.

## Completion and retry

Always set a finite `max_turns` proportional to scope (raise above low harness
defaults for multi-file audits; never leave it unbounded). Stop a running
subagent and pull work back to the main thread if it loops, stalls, or burns
turns without progress. Verify results rather than assuming completion:

1. Require a clear `COMPLETE` or `INCOMPLETE` (with remaining work) status in
   the prompt, and verify required files/outputs independently.
2. If a subagent stops early, returns `INCOMPLETE`, or omits required output,
   retry at most once with a higher bounded turn limit (passing partial
   results and remaining work; use a clean checkpoint for side effects), then
   finish in the main thread or report the gap.
3. Flag any turn-limit hit, retry, or unverifiable completion with `⚠️` next
   to the pass summary, stating what happened—never present an incomplete pass
   as finished.
