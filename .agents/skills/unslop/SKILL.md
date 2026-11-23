---
name: unslop
description: >-
  Rewrite prose, documentation, PR descriptions, or copy to remove
  AI-generated writing patterns, puffery, and machine cadence. Use when asked
  to make text sound more natural or human, fix robotic or stiff writing,
  remove AI tells, or unslop prose, docs, PRs, or copy.
argument-hint: "[file path | pasted text | (empty for latest message)]"
metadata:
  model-tier: trivial
---

Rewrite text so it reads as written by a person. Preserve meaning, facts, and
intended tone. If another voice skill is active, its rules win where they
conflict.

**Target:** No argument → your latest message in this session; pasted text →
rewrite in chat (write nothing to disk); file path → read the full file, show
the diff in chat, and write only after approval. Ask if unclear.

**Rewrite:** Read [PATTERNS.md](references/PATTERNS.md) first. Strip the
listed AI tells, then restore natural voice and varied rhythm (direct point
of view, specific phrasing, "I" where it fits). Do a final pass asking *"What
still reads as AI-generated?"* and fix anything left.
