---
name: design
description: >-
  Apply consistent visual design whenever creating or changing HTML, web UI,
  slide decks, presentations, charts, diagrams, posters, or visually laid-out
  documents, including quick teaching visuals and generated reports. Use even
  when the request does not mention design or a theme. Not for software
  architecture, prose-only edits, or file conversion without visual decisions.
metadata:
  model-tier: complex
---

Give visual work a coherent theme, readable hierarchy, and accessible colour.
This skill owns appearance; the calling skill keeps its content, teaching,
data, and delivery workflow.

**Choose one theme.** Use Anthropic-inspired unless the user explicitly asks
for Fastly-inspired. A Fastly topic, audience, or employer is not a request for
that theme. Honour an explicit custom theme or an existing product's design
system instead of silently reskinning it. These are informal visual themes,
not official collateral: add no logos, wordmarks, copyright claims, or implied
endorsement.

1. **Load only what applies, before designing.** Read
   [Anthropic-inspired](../shared/DESIGN-ANTHROPIC.md) for the default, or
   [Fastly-inspired](../shared/DESIGN-FASTLY.md) when requested; not both.
   Read [HTML guidance](../shared/DESIGN-HTML.md) only for HTML or web UI,
   and [slide guidance](../shared/DESIGN-SLIDES.md) only for presentations.
   An HTML deck needs both format references. For a custom or existing theme,
   use its supplied rules instead of either theme reference.
2. **Build within the brief.** Preserve real labels, facts, units, source
   citations, and interactions. Use generous whitespace, sentence case, and
   restrained decoration. Make meaning visible through labels and structure,
   not colour alone. Use the relevant format skill for PDF, PowerPoint,
   Google Slides, or other file mechanics; it does not replace these styles.
   Ask before adding dependencies or changing project code.
3. **Inspect the result.** Check legibility, text contrast (4.5:1 for normal
   text; 3:1 for large text), keyboard focus, clipping, and the final output
   size. Check narrow screens for web output. Every HTML deliverable includes
   an accessible System / Light / Dark control; inspect both explicit modes,
   including charts and diagrams. Preserve navigation and user state when
   changing modes. Honour reduced motion and print cleanly.

Deliver the requested file or link using the caller's workflow. State font
fallbacks, adaptations, and any unverified or unrun checks in the delivery
message, not as distracting decoration in the artifact.
