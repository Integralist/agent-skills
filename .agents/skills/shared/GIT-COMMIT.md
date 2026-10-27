# Git Commit Conventions

Shared safety, staging, and commit-message rules for skills that create Git
commits.

**Safety.** Secrets (keys, tokens, passwords, `.env` files) never get
committed. Read the diff and any untracked files before staging; if you find
one, stop and tell the user. Hooks always run.

**Staging.** Stage files by name, never `git add -A` or `.`.

**Message.** The commits are the user's own: add no co-author or "generated
with" trailer. Use this shape, with type `feat`, `fix`, `docs`, `chore`, or
`ci`:

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
file-writing tool, then `git commit -F <file>`. A heredoc into
`git commit -F -` can hang forever on a malformed terminator. If a hook
rewrites files, amend only for formatting or lint fixes; ask otherwise.
