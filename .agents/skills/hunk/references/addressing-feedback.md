# Addressing all feedback

`address` settles all threads in one pass and approves requested edits.

1. **Classify every thread** from
   `hunk session comment list "$SESSION_ID" --type all --json`:
   - **Resolved:** the request is met (question answered or edit made and
     verified) and the user's last message acknowledges it ("ok", "done",
     "thanks", or says to drop it).
   - **Pending:** everything else, including my unacknowledged last reply;
     when unsure, treat it as pending.

2. **Confirm deletions.** List each resolved thread's root note ID, anchor,
   one-line summary, and the total notes to remove. Say deletion cannot be
   undone and wait for an explicit yes. If declined, keep the threads.

3. **Delete confirmed threads** with
   `hunk session comment rm "$SESSION_ID" "<id>" --json`, removing replies
   before each root note. Record any failed removal and its error.

4. **Answer pending threads** using
   [Answering user notes](user-notes.md#answering-user-notes); make requested
   edits without asking for approval again.

5. **Report** counts of threads deleted, answered, and changed; include
   failures and threads still waiting on the user.
