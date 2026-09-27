# Review Modes

Always load "Select The Source," the selected source section, "Large Diffs,"
and "Empty Source." Local branch and all-local modes also load "Local Default
Branch." Load "Spec and Plan Adherence" when `--plan` is passed or the diff
touches `projects/` or `docs/specs/`.

## Select The Source

| Argument                      | Mode                            |
| ----------------------------- | ------------------------------- |
| PR URL or `owner/repo#number` | Remote PR                       |
| `--diff` or no argument       | Local branch vs. default branch |
| `--uncommitted`               | Local working-tree changes      |
| `--all-local`                 | Local branch plus working tree  |
| File path or glob pattern     | Explicit local paths            |

Never combine remote and local revisions silently.

## Remote PR

Use the GitHub CLI (`gh`) or equivalent:

1. `gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,headRefOid,additions,deletions`
2. `gh pr diff <number> --repo <owner>/<repo> --name-only`
3. `gh pr diff <number> --repo <owner>/<repo> > "$DIFF_PATH"`

The remote PR head is authoritative. Fetch full-file context from
`headRefOid`. A local checkout may be used only when its `HEAD` equals
`headRefOid` and the needed files have no working-tree changes.

If the checked-out PR branch has local commits or working-tree changes absent
from the remote PR, prompt the user to choose:

1. Review the remote PR exactly as published.
2. Review the local branch, including committed-but-unpushed changes.
3. Review all local changes, including uncommitted changes.

For local choices, use the PR's `baseRefName` as `DEFAULT_BRANCH`. Choice 2 uses
branch-diff mode; choice 3 uses all-local mode.

## Local Default Branch

Run these in order until one succeeds; store the result as `DEFAULT_BRANCH`:

1. `git rev-parse --verify main` — use `main`
2. `git rev-parse --verify master` — use `master`
3. `git symbolic-ref refs/remotes/origin/HEAD` — parse the branch name

## Local Branch (`--diff`)

```bash
BASE=$(git merge-base HEAD "$DEFAULT_BRANCH")
git diff "$BASE"...HEAD > "$DIFF_PATH"
git diff --name-only "$BASE"...HEAD
```

This includes committed-but-unpushed changes. Read full-file context from
`HEAD`; if the working tree differs, use `git show HEAD:<path>`.

## Uncommitted (`--uncommitted`)

```bash
git diff HEAD > "$DIFF_PATH"
git diff --name-only HEAD
git status --porcelain | sed -n 's/^?? //p'
```

Include untracked file contents alongside the diff.

## All Local (`--all-local`)

```bash
BASE=$(git merge-base HEAD "$DEFAULT_BRANCH")
git diff "$BASE" > "$DIFF_PATH"
git diff --name-only "$BASE"
git status --porcelain | sed -n 's/^?? //p'
```

This combines branch commits, staged changes, and unstaged changes. Include
untracked files as synthetic additions or full contents alongside the diff.

## Explicit Paths

Expand each path or glob and read its contents. For tracked paths, write
`git diff HEAD -- <paths>` to `DIFF_PATH`.

## Large Diffs

Always preserve the complete diff in `DIFF_PATH`; changed lines remain the
review boundary. Above about 3000 lines, set `LARGE_DIFF` true and optionally
create per-file shards. Reviewers may read full files for context, but findings
must concern changed behavior.

Use `headRefOid` for remote PR files, `HEAD` for branch-diff files, and the
working tree for uncommitted, all-local, or explicit-path files.

## Spec and Plan Adherence

Runs when `--plan[=<path>]` is passed, or automatically when the diff touches
`projects/` or `docs/specs/`.

Repositories following the `spec-delta` workflow keep two kinds of spec:

- **Project spec** — `projects/<date>-<slug>/spec.md`: this change's
  acceptance criteria and `## Behavioural Delta`. A finished project moves to
  `projects/completed/`, often in the same PR that delivers it.
- **Living spec** — `docs/specs/<capability>.md`: current behavior once the
  change merges.

Resolve intent documents in this order, adding every one found to
`CONTEXT_PATH` under its path:

1. `--plan=<path>`
2. Project files in the diff, including under `projects/completed/`. A project
   the diff adds or moves is this change's contract, not history.
3. A PR body link under `projects/`, `docs/plans/`, or `docs/tasks/`
4. With a bare `--plan` and nothing found above: the newest file matching
   `projects/*/{plan,tasks,tasks-slice-*}.md` (or legacy `docs/plans/*.md` /
   `docs/tasks/*.md`) by modification time, excluding `README.md`,
   `projects/completed/`, `docs/plans/completed/`, and
   `docs/tasks/completed/`

Then add each living spec named in a found project spec's
`## Living Specifications` section, and every `docs/specs/` file the diff
changes. A completed project outside the diff is history; the living spec
supersedes it.

When any intent document is found, spawn the Spec and Plan Adherence reviewer.
Its focus is:

- **Unplanned files** — changed files absent from the plan or task list
- **Missing implementation** — planned or tasked work absent from the diff
- **Scope excess** — adjacent work beyond the stated goal
- **Plan drift** — implementation contradicting the stated approach or verbatim
  task specification
- **Spec conflict** — the project spec, living spec, operational docs, PR body,
  and code disagree about behavior, including unchanged code bound by a
  contract the diff changes
- **Delta sync** — each `## Behavioural Delta` scenario appears in the living
  spec it names, and each behavioral edit to a `docs/specs/` file appears in a
  delta

Report scope excess without judging it. If `--plan` was passed and no intent
document is found, skip this reviewer and note that once in the summary.

## Empty Source

If the diff is empty and no files are found, report "No changes to review" and
stop.
