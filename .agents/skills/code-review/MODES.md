# Review Sources

The commands for each source. Each writes the full diff to `DIFF_PATH`; changed
lines stay the review boundary, though reviewers may read whole files for
context.

## Remote PR

```bash
gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,headRefOid,additions,deletions
gh pr diff <number> --repo <owner>/<repo> --name-only
gh pr diff <number> --repo <owner>/<repo> > "$DIFF_PATH"
```

The remote head is authoritative: read files at `headRefOid`. Use a local
checkout only when its `HEAD` equals `headRefOid` and the files have no
working-tree changes. If the checked-out branch has commits or changes the PR
lacks, ask the user to choose:

1. The remote PR as published.
2. The local branch, including unpushed commits (branch-diff, with the PR's
   `baseRefName` as `DEFAULT_BRANCH`).
3. All local changes, including uncommitted ones (all-local, same base).

## Default branch (local modes)

Use the first that succeeds as `DEFAULT_BRANCH`: `git rev-parse --verify main`,
`git rev-parse --verify master`, then the branch named by
`git symbolic-ref refs/remotes/origin/HEAD`.

## Local branch (`--diff`)

```bash
BASE=$(git merge-base HEAD "$DEFAULT_BRANCH")
git diff "$BASE"...HEAD > "$DIFF_PATH"
git diff --name-only "$BASE"...HEAD
```

Includes unpushed commits. Read files at `HEAD`, with `git show HEAD:<path>`
when the working tree differs.

## Uncommitted (`--uncommitted`)

```bash
git diff HEAD > "$DIFF_PATH"
git diff --name-only HEAD
git status --porcelain | sed -n 's/^?? //p'
```

Include untracked files' contents alongside the diff. Read files from the
working tree.

## All local (`--all-local`)

```bash
BASE=$(git merge-base HEAD "$DEFAULT_BRANCH")
git diff "$BASE" > "$DIFF_PATH"
git diff --name-only "$BASE"
git status --porcelain | sed -n 's/^?? //p'
```

Combines branch commits, staged, and unstaged changes; include untracked files'
contents. Read files from the working tree.

## Explicit paths

Expand each path or glob and read its contents. For tracked paths, write
`git diff HEAD -- <paths>` to `DIFF_PATH`.
