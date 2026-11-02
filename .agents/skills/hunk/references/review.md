# Review

1. **Find the session** with `hunk session list --json`, matching `repoRoot`
   or `cwd` to the current directory. Record `sessionId` as `SESSION_ID` and
   `repoRoot` (or `cwd`) as `SESSION_REPO`; pass `SESSION_ID` to every later
   command so targeting survives a reload onto a patch file.
   - No session: ask the user to run `hunk diff` in their terminal, then wait.
   - Several sessions, none matching: ask which window to drive.
   - `daemon-build-mismatch`: report whether the daemon or CLI is older and
     how many windows are attached; ask before `hunk daemon restart --yes`.

   Choose the requested workflow:
   - **`done`:** consider only sessions matching the current directory. If
     none match, report there's no review to finish and stop without launching
     Hunk or touching another repository; otherwise run step 5's finish branch.
   - **`comments`:** keep the target and threads; follow
     [Answering user notes](user-notes.md#answering-user-notes). If there are
     no user notes, say so and stop without changing the session.
   - **`address`:** keep the target; follow
     [Addressing all feedback](addressing-feedback.md#addressing-all-feedback),
     then stop.
   - **Existing user notes during review:** check
     `hunk session comment list "$SESSION_ID" --type user --json`; keep the
     target and threads, skip step 2, inspect in step 3, answer notes, then
     add findings in step 4.

2. **Load the target** (unless the selected workflow keeps it). Clear agent
   state with the commands in [Clear agent state](#clear-agent-state), then
   reload:
   - **Uncommitted** (no argument, `review`, `uncommitted`):
     `hunk session reload "$SESSION_ID" -- diff --watch`; add
     `--exclude-untracked` if the user wants tracked changes only.
   - **Staged:** `hunk session reload "$SESSION_ID" -- diff --staged --watch`.
   - **Branch** (`branch` or `<base>...<head>`): use the given base or get it
     from `git symbolic-ref --quiet --short refs/remotes/origin/HEAD`, strip
     `origin/`, and fall back to `main`; then reload with
     `hunk session reload "$SESSION_ID" -- diff "<base>...HEAD" --watch`.
   - **Commit** (`<commit-sha>` or `show <ref>`):
     `hunk session reload "$SESSION_ID" -- show "<sha>" --watch`.
   - **PR** (`PR #123`, `#123`, `owner/repo#123`, or URL): follow
     [Loading a pull request](pull-requests.md#loading-a-pull-request).

   Continue only after reload succeeds and the target is active.

3. **Inspect** with `hunk session review "$SESSION_ID" --json`, recording
   each file's `path` and each hunk's `newRange` and `oldRange`. For local or
   same-repo reviews, read changed files and callers for behaviour, edge
   cases, and contracts. For cross-repo PRs, read
   `$SESSION_REPO/.git/hunk-review-$SESSION_ID.patch` (or use `--include-patch`)
   and fetch surrounding context with `gh api`.

4. **Publish notes and focus stop 1.** Apply all findings or walkthrough
   stops in one batch, keeping existing user notes and replies. Each
   `newLine` or `oldLine` must be within a step 3 hunk range, or use a 1-based
   `"hunk": <n>`.

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

   Navigate to the first stop and highlight its key expression:

   ```bash
   hunk session navigate "$SESSION_ID" --file <path> --new-line <n> --json
   hunk session highlight add "$SESSION_ID" --file <path> --new-line <n> \
     --start <utf16-start> --end <utf16-end> --tone info --focus --json
   ```

   Give a short overview in chat and tell the user to leave notes in Hunk with
   `c` then run `address`, or reply "next" to walk through stops one by one.

5. **Handle follow-up turns:**
   - **`next`, `prev`, or another file/hunk:** clear highlights, navigate, and
     highlight the expression with `--tone current --focus`.
   - **`comments` or asks to read/answer notes:** follow
     [Answering user notes](user-notes.md#answering-user-notes).
   - **`address` or asks to handle all feedback:** follow
     [Addressing all feedback](addressing-feedback.md#addressing-all-feedback).
   - **`done`, `stop`, or `clear`:** clear agent state, restore the working-tree
     diff with `hunk session reload "$SESSION_ID" -- diff --watch --json`,
     leave the TUI and daemon running, say the review is finished, and stop.

## Clear agent state

Clear notes and highlights, this session's patch, and patches orphaned by
closed sessions:

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
