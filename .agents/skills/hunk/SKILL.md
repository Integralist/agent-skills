---
name: hunk
description: >-
  Review local changes or GitHub pull requests interactively in a live Hunk
  window, with inline notes and threaded replies to the user's Hunk comments.
  Use when the user asks to review with Hunk or to answer their Hunk notes.
disable-model-invocation: true
argument-hint: >-
  [review | comments | address | done | branch | staged | <commit-sha> |
  PR #<num> | <owner/repo>#<num> | <pr-url>]
metadata:
  model-tier: moderate
---

The user owns the Hunk TUI: use only `hunk session *`; never run
`hunk diff`, `hunk show`, `hunk gh`, `hunk patch`, or `hunk open` in the shell.
For an undocumented flag, STML rule, or daemon error, read `hunk skill path`,
run `hunk session <subcommand> --help`, or fetch `https://hunk.dev/llms.txt`.

Read [Review](references/review.md) for the workflow. Read [Loading a pull
request](references/pull-requests.md) before loading a PR, [Answering user
notes](references/user-notes.md) when handling notes, and [Addressing all
feedback](references/addressing-feedback.md) for `address`.
- **`address`:** Keep target; invocation approves requested edits. Delete
  resolved threads only after listing them and the user's explicit yes;
  deletion is irreversible.
- **`done`:** Finish only a session for the current directory. If none, report
  no review; do not launch Hunk or touch another repository.
- **PR number without a repository:** Confirm the repository before fetching.
- **Requested edits:** Usual code-edit approval applies except for `address`.
  Never edit an unrelated checkout for a remote PR.

Inspect every hunk. Publish findings or walkthrough stops in one inline-note
batch, focus stop 1, and give a short chat overview. Finish when requested
notes or walkthrough are handled, or the cleaned-up session is reported
finished. On reply, refresh, or anchor failure, follow workflow error
handling; do not claim completion.
