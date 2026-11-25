# Rewrite workflow

1. **Inspect before drafting.** Read `SKILL.md`, all linked references, and
   search the repo (including hidden `.agents/`, `.claude/`, and `tests/`) for
   callers, heading anchors, and contract tests. Check `git log` for recently
   added fixes so empirical guardrails are not mistaken for bloat. If
   references are already conditional and steps are test-locked safety gates,
   report that the skill is already lean rather than forcing cuts.
2. **Separate signal from over-prescription:**
   - **Keep:** Purpose, hard safety/approval gates, non-obvious house deltas,
     domain/tool gotchas, empirical fixes for observed model blind spots (such
     as newcomer context), and contract-tested requirements (surface test
     conflicts before proposing cuts).
   - **Extract:** Long conditional procedures, templates, or rare fallbacks
     into `references/` with explicit *"read only when..."* triggers.
   - **Cut or relax:** Textbook basics models already know, duplicated prose,
     micromanaged sentence/step rituals, and ceremony that doesn't scale with
     risk. Call out every intentional behavioural relaxation explicitly for
     user approval rather than silently dropping rules.
3. **Rewrite cleanly.** Follow
   [writing-for-agents](../../writing-for-agents/SKILL.md) and its
   [writing guide](../../writing-for-agents/references/WRITING.md). Link every
   invoked skill explicitly (`read and follow [<name>](../<name>/SKILL.md)`,
   adjusting the relative path from `references/`) rather than leaving bare
   skill names, link each skill once per step or paragraph instead of
   repeating its path nearby, re-read each edited sentence to fix mismatched
   prepositions or dropped purpose verbs, and never drop frontmatter flags,
   `allowed-tools`, or tested triggers unintentionally. When removing
   `disable-model-invocation: true`, audit and update `description` with clear
   `Use when ...` triggers; keep noun-first names (`<noun>-<verb>`) with
   `<verb> <noun>` triggers. Audit `argument-hint` and body argument handling
   so `[steering]` is the only optional positional argument, every optional
   target, path, ref, mode, or option uses `--flag` or `--key[=<value>]`
   (bound with `=`), and numbered GitHub refs use `#<...>` (such as
   `--pr=<url|#number>`). Audit `allowed-tools` against
   [SKILL-MECHANICS.md](../../writing-for-agents/references/SKILL-MECHANICS.md):
   tighten wildcarded dual-purpose commands to strictly read-only subcommands
   or exact invocations, and keep mutating or remote-write commands out.
4. **Verify after approval.** Check UTF-8 byte counts, confirm every relative
   link and anchor resolves, run affected repo tests/linters (`make check-rules`,
   contract tests, etc.), and report any unrun verification as a gap.
