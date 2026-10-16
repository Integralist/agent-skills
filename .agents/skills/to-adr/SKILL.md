---
name: to-adr
description: >-
  Extract Architecture Decision Records from a plan, spec, or this session's
  discussion, one per decision that clears the value bar. Use when recording
  an architectural decision with rejected alternatives.
argument-hint: "[source path]"
allowed-tools: Bash(git config:*), Bash(date:*), Bash(git mv:*), Glob, Read, Edit, Write
metadata:
  model-tier: complex
---

# To ADR

Turn a source (a plan, spec, or this session's discussion) into ADRs: one for
each decision worth recording, in the format
[ADR-FORMAT.md](../shared/ADR-FORMAT.md) sets. Extract; don't invent. A
decision earns an ADR only when it passes that file's three tests, and a
source with none produces no ADR.

**Stop and ask.** Follow the source as given, but when something is missing,
contradictory, or looks like the wrong design, tell the user and wait. Don't
fill the gap with a guess.

1. **Pick the source.** Use the file the user or calling skill names. With
   none, use this session's discussion. Done when you've read the source in
   full.

2. **Find the decisions.** List each fork the source settled, and keep only
   those that pass all three tests. Give each kept decision its own ADR. Done
   when every kept decision has a rejected alternative and a reason, and you
   can say which test each dropped one fails.

3. **Number and file them** as ADR-FORMAT.md describes: migrate legacy files
   first, then assign the next IDs in source order and pick each ADR's folder.
   Done when every ADR has an ID and a path.

4. **Write each ADR** from the template. Add it to `docs/adr/README.md`, and a
   project ADR to its project README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when the
   files and indexes are written and you've reported each file with a
   one-line summary, or said why no decision warranted an ADR.
