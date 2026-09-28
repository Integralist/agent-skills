# Voice Modes

Shared mode contract for voice skills (`product-voice`, `integralist-voice`,
`adhd-voice`). Read the invocation, pick exactly one mode, then apply the
calling skill's voice rules.

## Pick the mode

1. **One-off (default).** No flag. Apply the voice once, then return to your
   normal reply style.
   - Text follows the slash command (`/product-voice <text>`): rewrite that
     text in the voice. Keep every fact, identifier, and caveat.
   - Nothing follows the slash command (`/product-voice`): rewrite your
     previous reply in the voice. If there is no previous reply, ask for the
     text.
   - The voice is named inside a request ("write the PR description and use
     product-voice"): do the request, writing its output in the voice.
2. **Persistent.** `--all`, or the user asks for the voice across the session
   ("use product-voice for all communication", "reply in adhd-voice from now
   on"). Confirm in one line written in the voice, then write every later
   reply in it. If text also follows `--all`, rewrite that text too.
3. **Off.** `--off`, or the user asks to stop ("stop using product-voice",
   "back to normal"). Confirm in one plain line and return to your normal
   reply style.

## While persistent

- The mode stays on every reply until turned off, however many turns pass.
  When unsure whether it is still on, treat it as on.
- One persistent voice at a time: turning on another voice replaces this one.
  A one-off request for a different voice applies to that text only, then
  this voice resumes.
- The voice governs the prose of your replies to the user. Code, commands,
  diffs, quoted errors, and file contents stay exact. Files, commits, and
  other artifacts follow their own conventions unless the user names the
  voice for them.
- Keep the structural conventions from the user's instruction files (state
  anchors, sequential numbering, action-first lines); the voice sets tone and
  wording within them.
- Write security warnings, confirmations before irreversible actions, and
  answers to "what do you mean?" plainly, then resume the voice on the next
  reply.
- Record "`<voice>` persistent mode is on" in any summary, compaction, or
  handoff you write, so the mode survives context loss.
