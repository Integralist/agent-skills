# Loading a pull request

**Confirm the repository** before fetching when the user gives only a PR
number. Normalize `git remote get-url origin` to `<owner>/<repo>` and ask:

```txt
Which repository is PR #<number> in?
1. <owner>/<repo> (current directory)
2. Another repository: reply with owner/repo
```

**Load inside `SESSION_REPO`** because Hunk's `reloadBounds` rejects repos
and patch files outside it. Start with:

```bash
gh pr view <number> --repo "<owner>/<repo>" \
  --json title,body,baseRefName,headRefOid,url
```

- **Same repository:** fetch refs without touching the checked-out branch or
  working tree, then reload the range:

  ```bash
  git -C "$SESSION_REPO" fetch origin \
    "refs/heads/<baseRefName>:refs/remotes/origin/<baseRefName>" \
    "+pull/<number>/head:refs/hunk/pr-<number>"
  hunk session reload "$SESSION_ID" -- diff \
    "origin/<baseRefName>...refs/hunk/pr-<number>" --watch
  ```

- **Another repository:** keep a separate diff per session under `.git/`, in
  bounds and out of `git status`, then reload it:

  ```bash
  gh pr diff <number> --repo "<owner>/<repo>" > \
    "$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch"
  hunk session reload "$SESSION_ID" -- patch \
    "$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch" --watch
  ```
