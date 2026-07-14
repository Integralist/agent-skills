# Review Modes

Always load "Select The Source," the selected source section, "Large Diffs,"
and "Empty Source." Local branch and all-local modes also load "Local Default
Branch." When requested, load "Plan Modifier."

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
1. `gh pr diff <number> --repo <owner>/<repo> --name-only`
1. `gh pr diff <number> --repo <owner>/<repo> > "$DIFF_PATH"`

The remote PR head is authoritative. Fetch full-file context from
`headRefOid`. A local checkout may be used only when its `HEAD` equals
`headRefOid` and the needed files have no working-tree changes.

If the checked-out PR branch has local commits or working-tree changes absent
from the remote PR, prompt the user to choose:

1. Review the remote PR exactly as published.
1. Review the local branch, including committed-but-unpushed changes.
1. Review all local changes, including uncommitted changes.

For local choices, use the PR's `baseRefName` as `DEFAULT_BRANCH`. Choice 2 uses
branch-diff mode; choice 3 uses all-local mode.

## Local Default Branch

Run these in order until one succeeds; store the result as `DEFAULT_BRANCH`:

1. `git rev-parse --verify main` — use `main`
1. `git rev-parse --verify master` — use `master`
1. `git symbolic-ref refs/remotes/origin/HEAD` — parse the branch name

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

## Plan Modifier (`--plan[=<path>]`)

Resolve the plan in this order:

1. `--plan=<path>`
1. A PR body link under `docs/plans/`
1. The newest `docs/plans/*.md` by modification time, excluding `README.md` and
   `docs/plans/completed/`

When found, add its contents to `CONTEXT_PATH` and spawn the Plan Adherence
reviewer. Its focus is:

- **Unplanned files** — changed files absent from the plan
- **Missing implementation** — planned work absent from the diff
- **Scope excess** — adjacent work beyond the stated goal
- **Plan drift** — implementation contradicting the stated approach

Report scope excess without judging it. If no plan is found, skip this reviewer
and note that once in the summary.

## Empty Source

If the diff is empty and no files are found, report "No changes to review" and
stop.
