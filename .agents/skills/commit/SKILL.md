---
name: commit
description: >-
  Create git commits with intelligent file grouping. Use when
  committing changes or drafting a commit message.
argument-hint: '[force]'
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git diff:*), Bash(git commit:*)
metadata:
  model-tier: trivial
---

Commit the working tree as one or more Conventional Commits, each subject
saying why the change matters. The commits are the user's own: add no
co-author or "generated with" trailer. Start with `git status --short --branch`
and `git diff HEAD`.

**Branch.** On `main` or `master`, unless the user passed `force`, warn them
and ask for approval to commit there. If they decline, use the branch skill to
create a branch, then carry on.

**Safety.** Secrets (keys, tokens, passwords, `.env` files) never get
committed. Read the diff and any untracked files before staging; if you find
one, stop and tell the user. Hooks always run.

**Staging.** If the tree is clean, say so and stop. If the user has already
staged files, ask whether to commit only those or everything — their stage is
deliberate. Stage files by name, never `git add -A` or `.`.

**Grouping.** Group files by purpose — a change with its tests, docs, config —
and commit groups in dependency order. Commit an obvious grouping straight
away. When it's ambiguous, offer 2–3 numbered groupings with your
recommendation and wait.

**Message.** Use this shape, with type `feat`, `fix`, `docs`, `chore`, or `ci`:

```txt
<type>(<scope>): <why it matters, imperative mood>

<what changed and how it was verified>
```

The subject answers "so what?"; the diff already shows the mechanics. Describe
the diff, not the request — if they disagree, tell the user.

```txt
BAD:  fix(ratelimit): set burst to 200
GOOD: fix(ratelimit): raise burst so valid retries stop being dropped
```

**Commit.** Write the message to a uniquely named temp file with your
file-writing tool, then `git commit -F <file>`. A heredoc into `git commit -F -`
can hang forever on a malformed terminator. If a hook rewrites files, amend
only for formatting or lint fixes; ask otherwise.
