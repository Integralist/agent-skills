# Answering user notes

Reply under every handled note in Hunk, whether found on entry or added
during review.

1. **Read the view and threads:**

   ```bash
   hunk session get "$SESSION_ID" --json
   hunk session review "$SESSION_ID" --include-notes --json
   hunk session comment list "$SESSION_ID" --type all --json
   ```

   Record each user note's ID, anchor, body, and replies; read the code or
   patch behind it. Skip finished edits and answered questions unless asked
   to revisit them. Keep approval requests, blockers, and clarifications
   pending until resolved. From session details and history, record the exact
   reload arguments (source options, `--`, command, refs, flags, pathspecs) in
   Bash array `RELOAD_ARGS`. Ask rather than guess if the target is unclear.

2. **Act on each note and reply under it, even if no code changed:**
   - **Question:** answer it.
   - **Requested edit:** get approval under usual code-edit rules, edit the
     matching checkout, run relevant checks, and report the change, checks,
     and anything untested. For remote PRs, never edit an unrelated checkout.
   - **Blocked, declined, unclear, or awaiting approval:** reply with the
     reason or question.

   ```bash
   hunk session comment add "$SESSION_ID" --reply-to "<note-id>" \
     --summary "<answer, completed change, or blocker>" \
     --rationale "<supporting detail or checks, if needed>" --focus --json
   ```

3. **Refresh the same view and verify** after the batch or before pausing for
   approval. Do not clear comments; watch mode alone is insufficient.

   ```bash
   hunk session reload "$SESSION_ID" --json "${RELOAD_ARGS[@]}"
   hunk session review "$SESSION_ID" --include-notes --json
   hunk session comment list "$SESSION_ID" --type all --json
   ```

   For a PR opened with `hunk gh` (`inputKind` is `patch`), Hunk may reject a
   new patch path as outside its initial root, even under `.git`. Instead,
   overwrite the original `sourceLabel` from `hunk session get` in place:

   ```bash
   SOURCE="<sourceLabel from hunk session get>"
   TMP="${SOURCE}.refresh.$$"
   trap 'rm -f "$TMP"' EXIT
   gh pr diff <number> --repo "<owner>/<repo>" > "$TMP" &&
     test -s "$TMP" && mv "$TMP" "$SOURCE" &&
     hunk session reload "$SESSION_ID" --json -- patch "$SOURCE" --watch
   ```

   Focus a reply with
   `hunk session navigate "$SESSION_ID" --comment "<reply-id>" --json`.
   If a reply, refresh, or anchor fails, report the exact error, keep note IDs
   and reply text for retry, and do not call the batch complete. Finish when
   the target is unchanged and every reply is visible, or report the failure.
