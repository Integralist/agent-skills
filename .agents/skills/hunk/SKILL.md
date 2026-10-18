---
name: hunk
description: >-
  Review local changes or GitHub pull requests interactively in a live Hunk
  window, with inline notes and threaded replies to the user's Hunk comments.
  Use when the user asks to review with Hunk or to answer their Hunk notes.
disable-model-invocation: true
argument-hint: >-
  [review | comments | done | branch | staged | <commit-sha> | PR #<num> |
  <owner/repo>#<num> | <pr-url>]
metadata:
  model-tier: complex
---

# Hunk Interactive Code Review

Drive the user's live Hunk window through `hunk session` commands: load a
changeset, leave inline notes, highlight the expression under discussion, and
answer the user's notes in a back-and-forth loop. The user owns the TUI, so
control it only through `hunk session *`, never by running `hunk diff`,
`hunk show`, `hunk gh`, `hunk patch`, or `hunk open` in your shell. For a flag,
STML rule, or daemon error not covered here, read the file at
`hunk skill path`, run `hunk session <subcommand> --help`, or fetch
`https://hunk.dev/llms.txt`.

**Clearing agent state.** Several steps clear your notes, highlights, this
session's patch file, and patch files orphaned by closed sessions:

```bash
hunk session comment clear "$SESSION_ID" --yes --json
hunk session highlight clear "$SESSION_ID" --json
rm -f "$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch"
LIVE_IDS="$(hunk session list --json | jq -r '.sessions[]?.sessionId // .[]?.sessionId // empty')"
for f in "$SESSION_REPO"/.git/hunk-review-*.patch; do
  [ -e "$f" ] || continue
  id="${f##*hunk-review-}"; id="${id%.patch}"
  printf '%s\n' "$LIVE_IDS" | grep -Fxq "$id" || rm -f "$f"
done
```

## Review

1. **Find the session** with `hunk session list --json`, matching `repoRoot`
   or `cwd` to the current directory, and record its `sessionId` as
   `SESSION_ID` and its `repoRoot` (or `cwd`) as `SESSION_REPO`. Pass
   `SESSION_ID` to every later command, so targeting survives a reload onto a
   patch file.
   - No session: ask the user to run `hunk diff` in their terminal, and wait.
   - Several and none match: ask which window to drive.
   - `daemon-build-mismatch`: say whether the daemon or the CLI is older and
     how many windows are attached, and ask before running
     `hunk daemon restart --yes`.

   Then pick the workflow:
   - **`done`:** consider only sessions matching the current directory, even
     if just one is live; if none match, say there's no review to finish and
     stop, without launching Hunk or touching other repositories. Otherwise
     run the finish branch of step 5 and stop.
   - **`comments`:** keep the loaded target and every thread, and run
     [Answering user notes](#answering-user-notes); with no user notes, say
     so and stop without changing the session.
   - **Review with existing user notes** (check with
     `hunk session comment list "$SESSION_ID" --type user --json`): keep the
     target and every thread, skip step 2, inspect in step 3, answer the
     notes, then add any further findings in step 4.

   Done when `SESSION_ID` and `SESSION_REPO` are set and the workflow is
   chosen.
2. **Load the target.** Clear agent state, then reload:
   - **Uncommitted** (no argument, `review`, or `uncommitted`):
     `hunk session reload "$SESSION_ID" -- diff --watch`, adding
     `--exclude-untracked` if the user wants tracked changes only.
   - **Staged:** `hunk session reload "$SESSION_ID" -- diff --staged --watch`.
   - **Branch** (`branch`, or `<base>...<head>`): take the base from the
     argument or from
     `git symbolic-ref --quiet --short refs/remotes/origin/HEAD` with
     `origin/` stripped (falling back to `main`), then
     `hunk session reload "$SESSION_ID" -- diff "<base>...HEAD" --watch`.
   - **Commit** (`<commit-sha>` or `show <ref>`):
     `hunk session reload "$SESSION_ID" -- show "<sha>" --watch`.
   - **Pull request** (`PR #123`, `#123`, `owner/repo#123`, or a URL):
     follow [Loading a pull request](#loading-a-pull-request).

   Done when the reload succeeds and the target is active.
3. **Inspect** with `hunk session review "$SESSION_ID" --json`, recording
   each file's `path` and `hunks[].newRange` and `oldRange`. For a local or
   same-repo review, read changed files and callers from disk to check
   behaviour, edge cases, and contracts. For a cross-repo PR, read the patch
   at `$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch` (or add
   `--include-patch`) and fetch surrounding context with `gh api`. Done when
   every hunk range is known and the change is analysed.
4. **Publish notes and focus stop 1.** Apply all findings or walkthrough
   stops in one batch, keeping existing user notes and replies. Every
   `newLine` or `oldLine` must fall inside a hunk range from step 3, or use a
   1-based `"hunk": <n>`.

   ```bash
   cat <<'EOF' | hunk session comment apply "$SESSION_ID" --stdin --focus --json
   {
     "comments": [
       {
         "filePath": "path/to/file.go",
         "newLine": 42,
         "summary": "Headline finding or walkthrough stop",
         "rationale": "Concise explanation or concrete fix."
       }
     ]
   }
   EOF
   ```

   Then navigate to the first stop and highlight its key expression:

   ```bash
   hunk session navigate "$SESSION_ID" --file <path> --new-line <n> --json
   hunk session highlight add "$SESSION_ID" --file <path> --new-line <n> \
     --start <utf16-start> --end <utf16-end> --tone info --focus --json
   ```

   Give a short overview in chat and the next step: reply "next", or press
   `c` in Hunk to leave a note and tell you to read it. Done when the notes
   are applied, stop 1 is highlighted, and the overview is in chat.
5. **Loop** on each user turn:
   - **"next", "prev", or another file or hunk:** clear highlights, navigate
     there, and highlight the expression with `--tone current --focus`.
   - **`comments`, or asks you to read or answer their notes:** run
     [Answering user notes](#answering-user-notes).
   - **`done`, "stop", "done", or "clear":** clear agent state, restore the
     working tree with
     `hunk session reload "$SESSION_ID" -- diff --watch --json`, leave the
     TUI and daemon running, say the review is finished, and stop.

   Done when each request is handled, or the session is cleaned up.

## Answering user notes

Use this for notes found on entry and notes added during the review. A reply
in chat doesn't count: every handled note gets a reply under it in Hunk.

1. **Read the view and threads:**

   ```bash
   hunk session get "$SESSION_ID" --json
   hunk session review "$SESSION_ID" --include-notes --json
   hunk session comment list "$SESSION_ID" --type all --json
   ```

   Record each user note's ID, anchor, body, and replies, and read the code
   or patch behind it. Skip finished edits and answered questions unless
   asked to revisit them; approval requests, blockers, and clarifications
   stay pending until resolved. Record the current reload arguments (source
   options, `--`, command, refs, flags, pathspecs) in a Bash array
   `RELOAD_ARGS`, from the session details and history, and ask rather than
   guess if the target is unclear. Done when every pending note and
   `RELOAD_ARGS` are known.
2. **Act on each note and reply under it,** even when no code changed:
   - **Question:** answer it.
   - **Requested edit:** get approval under the usual code-edit rules, make
     the change in the matching checkout, run the relevant checks, and reply
     with what changed and how it was verified, saying what's untested. For a
     remote PR, never edit an unrelated local checkout.
   - **Blocked, declined, unclear, or awaiting approval:** reply with the
     reason or the question.

   ```bash
   hunk session comment add "$SESSION_ID" --reply-to "<note-id>" \
     --summary "<answer, completed change, or blocker>" \
     --rationale "<supporting detail or checks, if needed>" --focus --json
   ```

   Done when every pending note has a reply.
3. **Refresh the same view and verify,** without clearing comments, after the
   batch or before pausing for approval; watch mode alone isn't enough:

   ```bash
   hunk session reload "$SESSION_ID" --json "${RELOAD_ARGS[@]}"
   hunk session review "$SESSION_ID" --include-notes --json
   hunk session comment list "$SESSION_ID" --type all --json
   ```

   For a PR opened with `hunk gh` (`inputKind` is `patch`), Hunk may reject a
   new patch path as outside its initial root, even under `.git`. Overwrite
   the original `sourceLabel` from `hunk session get` in place instead:

   ```bash
   SOURCE="<sourceLabel from hunk session get>"
   TMP="${SOURCE}.refresh.$$"
   trap 'rm -f "$TMP"' EXIT
   gh pr diff <number> --repo "<owner>/<repo>" > "$TMP" &&
     test -s "$TMP" && mv "$TMP" "$SOURCE" &&
     hunk session reload "$SESSION_ID" --json -- patch "$SOURCE" --watch
   ```

   Focus the relevant reply with
   `hunk session navigate "$SESSION_ID" --comment "<reply-id>" --json`. If a
   reply, refresh, or anchor fails, report the exact error, keep the note IDs
   and reply text for a retry, and don't call the batch complete. Done when
   the target is unchanged and every reply is visible, or the failure is
   reported.

## Loading a pull request

**Confirm the repository** when the user gives only a number. Normalise
`git remote get-url origin` to `<owner>/<repo>` and ask before fetching
anything:

```txt
Which repository is PR #<number> in?
1. <owner>/<repo> (current directory)
2. Another repository: reply with owner/repo
```

**Load it** inside `SESSION_REPO`, since Hunk's reload sandbox
(`reloadBounds`) rejects repos and patch files outside it. Start with
`gh pr view <number> --repo "<owner>/<repo>" --json title,body,baseRefName,headRefOid,url`.

- **Same repository:** fetch the refs without touching the checked-out branch
  or working tree, and reload onto the range:

  ```bash
  git -C "$SESSION_REPO" fetch origin \
    "refs/heads/<baseRefName>:refs/remotes/origin/<baseRefName>" \
    "+pull/<number>/head:refs/hunk/pr-<number>"
  hunk session reload "$SESSION_ID" -- diff "origin/<baseRefName>...refs/hunk/pr-<number>" --watch
  ```

- **Another repository:** write the diff under `.git/`, which keeps it in
  bounds, separate per session, and out of `git status`, and reload onto it:

  ```bash
  gh pr diff <number> --repo "<owner>/<repo>" > "$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch"
  hunk session reload "$SESSION_ID" -- patch "$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch" --watch
  ```
