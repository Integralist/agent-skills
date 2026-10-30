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

## Recorded execution (`--baseline=<commit>`)

Use the recorded baseline, not a merge base with the default branch. Require
an execution delivery manifest and the initial state from
[REVIEW-CHANGE.md](../shared/REVIEW-CHANGE.md). It identifies owned paths and
hunks, inherited changes to exclude, and the delivered state to review. A
commit alone cannot distinguish work that was already dirty before execution.

For wholly owned paths that were clean at the baseline, the caller supplies
`BASELINE` and the `OWNED_PATHS` Bash array from that manifest:

```bash
BASE=$(git rev-parse --verify "${BASELINE}^{commit}")
git diff "$BASE" -- "${OWNED_PATHS[@]}"
git diff --name-only "$BASE" -- "${OWNED_PATHS[@]}"
git ls-files --others --exclude-standard -- "${OWNED_PATHS[@]}"
```

Require a nonempty `OWNED_PATHS` selection before these commands; an empty
array would select the whole repository. Write the diff to `DIFF_PATH` and
include selected new files' contents. This captures committed, staged, and
unstaged changes together; retain deletions and inspect both sides of renames.
For mixed-ownership files, use the manifest's isolated before/after content to
produce the owned patch rather than these whole-file commands. Verify the
manifest covers all delivered work, not only the latest task or commit.

Read code and intent from the exact delivered snapshot, using temporary
snapshots when the live checkout includes excluded changes. Record HEAD,
content fingerprints, and exclusions in `CONTEXT_PATH`; keep the source stable
and confirm it stayed unchanged. If scope or snapshots are missing or
ambiguous, report the gap rather than falling back to another source mode.

## Explicit paths

Expand each path or glob and read its contents. For tracked paths, write
`git diff HEAD -- <paths>` to `DIFF_PATH`.
