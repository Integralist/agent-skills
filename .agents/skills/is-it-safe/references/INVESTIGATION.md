# Investigation guide

## Resolve the exact change

- **No argument:** inspect the current branch and worktree against upstream:
  unpushed commits, staged/unstaged tracked changes, and untracked
  non-ignored files. Keep committed and worktree changes distinct. On the
  default branch compare local `HEAD` with its remote-tracking upstream (for
  example `main` with `origin/main`), never with itself. With no upstream,
  use an identifiable, sound remote default-branch ref. Use local refs and say
  if the remote-tracking ref may be stale. If nothing is pending, ask for a
  commit, range, or PR; never assume the latest commit.
- **PR URL or number:** inspect the PR diff, not the checkout:
  `gh pr view "$PR" --json number,title,state,baseRefName,headRefName,baseRefOid,headRefOid,url`
  and `gh pr diff "$PR"`. Use `gh api` only for missing data and check
  endpoint semantics: a 404 from a branch-protection endpoint may mean the
  branch isn't protected. Encode slash-containing branch names used as one
  REST path parameter, or list and filter exact names; prefer PR head metadata
  over assuming a branch exists. In jq, use `contains("text")` for substring
  checks (`"\\."` is an invalid string escape). A failed request or jq
  expression is a failed query, not evidence. Fix it if material; if the PR
  still cannot be read, return `UNKNOWN` and name the missing access.
- **Commit, range, or base ref:** review exactly that target; don't add
  worktree changes to an explicit range. For a base ref compare it with
  `HEAD` plus worktree changes, naming each scope.

Done when the exact diff and baseline are identified, or the report says why
they couldn't be.

## Trace and disprove

Read the diff, intent, and touched files. Follow callers, consumers,
invariants, configuration, and deploy/rollback paths only where they could
change the verdict. Scale to the diff, batch independent reads, and reuse
evidence. Consider material harm such as data loss/corruption, unauthorized
access/disclosure, broad availability/performance failure, broken
compatibility, or irreversible external effects as prompts, not a report
checklist. Trace the strongest candidate as **trigger → changed behaviour →
affected system/users → consequence**, with evidenced preconditions, blast
radius, and safeguards or recovery. Drop unreachable speculation or name the
unresolved condition.

Check callers, validation, feature gates, tests, and safeguards to refute the
candidate. Run a targeted test only if it answers a material question and
runner configuration or authoritative docs confirm a disposable sandbox with
no host files outside the checkout, host credentials, or production access.
Otherwise skip it and say why.

For a candidate depending on cross-module callers or safeguards, use one
independent read-only subagent to refute that path. Follow
[SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md). Provide the
resolved revision/diff, candidate chain, scoped paths, and known evidence.
Grant only verified read-only tools (no tests, edits, or remote writes) and a
40-turn budget. Require COMPLETE/INCOMPLETE, inspected paths, cited safeguards
and counterevidence, and unknowns. Verify decisive evidence yourself and keep
the verdict in the main thread. If delegation is unavailable, say so and
disprove it yourself.

Cite `path/to/file.ext:line`; separate facts from assumptions and name
unknowns rather than guessing. Stop when the candidate is confirmed or
refuted, safeguards are checked, and decision-relevant unknowns are explicit.
