---
name: agents-md
description: >-
  Make AGENTS.md the canonical project-instructions file, with CLAUDE.md and
  GEMINI.md as stubs that import it, and audit it for drift and lessons. Use
  when onboarding a project, auditing AGENTS.md, or updating agent
  instructions.
argument-hint: "[--learn]"
metadata:
  model-tier: moderate
---

Make `AGENTS.md` canonical; Claude and Gemini import it. Copilot reads it
natively; merge its legacy instructions as content, never import them.
Inventory root `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and
`.github/copilot-instructions.md`; a file containing only `@AGENTS.md` or
boilerplate is a stub. Repair both stubs; keep shared guidance in `AGENTS.md`.
Keep Claude/Gemini-specific notes in matching stubs; Copilot-only notes in its
file, never imported.

**Approval gate.** Never write before user confirmation. Preserve user wording;
don't drop content without agreement. When unsure, keep both versions in
`AGENTS.md` and flag overlap. Wrap Markdown at 80 columns.

## Choose a mode

- **Reconcile** (default, one shot): `AGENTS.md` is missing, weaker than
  another file, or either stub does not import it. Read
  [RECONCILE.md](references/RECONCILE.md) and
  [PROJECT-STEWARDSHIP.md](../shared/PROJECT-STEWARDSHIP.md) to capture WHY
  and check conflicts; follow the
  [decision table](references/RECONCILE.md#choose-how-to-reconcile).
- **Update** (repeatable): `AGENTS.md` has content and both stubs import it.
  Read [UPDATE.md](references/UPDATE.md) and run its full audit and lesson
  harvest. For a full Update, also read
  [PROJECT-STEWARDSHIP.md](../shared/PROJECT-STEWARDSHIP.md).
- **`--learn`:** run only the lesson step against existing `AGENTS.md`, still
  requiring one confirmation. Read the
  [`--learn` steps](references/UPDATE.md#--learn). If `AGENTS.md` is missing,
  say so and choose a mode normally.

Before writing, read the
[verification checklist](references/UPDATE.md#verify-after-any-write).
After any write, complete the verification checklist.

## Run and finish

Follow the selected guide. Report which file is canonical, what moved, and
what was created.
