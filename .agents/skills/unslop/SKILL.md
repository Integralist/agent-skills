---
name: unslop
description: >-
  Rewrite prose, documentation, PR descriptions, or copy to remove
  AI-generated writing patterns, puffery, and machine cadence. Use when asked
  to remove AI tells, humanize text, or unslop something.
disable-model-invocation: true
argument-hint: "[file path | pasted text | (empty for latest message)]"
metadata:
  model-tier: trivial
---

Rewrite text so it reads as written by a person. Remove the patterns in
[PATTERNS.md](references/PATTERNS.md), then add the voice that their removal
leaves missing. Preserve meaning and intended tone. If another voice skill is
also active, its rules take precedence where they conflict.

**Choose the target.** With no argument, use your latest message in this
session. With pasted text, use that text. Rewrite either in chat and write
nothing to disk. With a file path, read the whole file, propose the diff in
chat, and write it only after the user approves. Ask if the target is unclear.

**Rewrite.** Read PATTERNS.md before editing. Remove the listed patterns,
then give the text a point of view and varied rhythm. React to facts rather
than neutrally listing pros and cons; acknowledge complexity; use "I" when it
fits; be specific rather than sterile. Audit the result by asking, "What makes
this obviously AI-generated?" Fix anything you find.

**Done when** the target and destination are clear, the meaning and intended
tone remain, and the audit finds no obvious AI-generated writing patterns.
