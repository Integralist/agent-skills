# Rewrite workflow

1. **Inspect before drafting.** Read `SKILL.md`, all linked references, and
   search the repo (including hidden `.agents/`, `.claude/`, and `tests/`) for
   callers, heading anchors, and contract tests.
2. **Separate signal from over-prescription:**
   - **Keep:** Purpose, hard safety/approval gates, non-obvious house deltas,
     domain/tool gotchas, and contract-tested requirements.
   - **Extract:** Long conditional procedures, templates, or rare fallbacks
     into `references/` with explicit *"read only when..."* triggers.
   - **Cut or relax:** Textbook basics models already know, duplicated prose,
     micromanaged sentence/step rituals, and ceremony that doesn't scale with
     risk. Call out every intentional behavioural relaxation explicitly for
     user approval rather than silently dropping rules.
3. **Rewrite cleanly.** Follow
   [writing-for-agents](../../writing-for-agents/SKILL.md) and its
   [writing guide](../../writing-for-agents/references/WRITING.md). Never drop
   frontmatter flags, `allowed-tools`, or tested triggers unintentionally.
4. **Verify after approval.** Check UTF-8 byte counts, confirm every relative
   link and anchor resolves, run affected repo tests/linters (`make check-rules`,
   contract tests, etc.), and report any unrun verification as a gap.
