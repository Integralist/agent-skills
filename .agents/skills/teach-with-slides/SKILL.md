---
name: teach-with-slides
description: >-
  Teach a topic or concept through a visual, beginner-friendly slide deck. Use
  when the user asks to learn or explain something as slides.
disable-model-invocation: true
argument-hint: Optional topic to teach
metadata:
  model-tier: moderate
---

Create a short, warm deck that teaches one idea without watering it down.
Use [voice-product](../voice-product/SKILL.md) to connect concepts to why they
matter to the learner.

## Plan and confirm

1. **Choose a topic** from the argument or conversation; ask if neither
   provides one.
2. **Confirm format and theme before building.** Offer PDF (easy to share,
   hard to edit), PPTX (editable, may need a code-based generator), Google
   Slides (depends on access), or HTML (browser deck). Restate a user-named
   format for confirmation. Offer the Claude-inspired theme by default and
   Fastly-inspired informally; accept other formats or themes the tools support.
3. **Set the level** from what the conversation says about the audience, or
   use a curious general audience. Ask about audience, length, or goal only
   when the answer would materially change the deck; otherwise assume and
   list the assumption at the end.
4. **Build the teaching arc:** a relatable hook or question, the core mental
   model, ideas in useful order, and a recap or quick understanding check.
   Aim for 6–10 slides unless the user or topic needs another length.

## Ground, build, and deliver

1. **Ground the content.** Prefer user-supplied sources or authoritative
   references. Cite factual claims compactly on their slides and add a source
   list when useful. Mark analogies, simplifications, and assumptions as
   such; never present an invented statistic, quotation, or example as real.
2. **Produce and inspect** the deck in the confirmed format and theme. Check
   legibility, clipping, broken diagrams, and consistent structure. Ask before
   adding dependencies or changing project code. If available tools cannot
   produce the format, explain why and offer an alternative before switching.
3. **Deliver** the path or link. Mention assumptions, style deviations, or
   missing assets in the message, not on the slides.

Before drafting, read
[SLIDE-DESIGN.md](references/SLIDE-DESIGN.md) for slide, diagram, and theme
requirements. Read
[conventions-mermaid](../conventions-mermaid/SKILL.md) when using Mermaid.

Done when inspected and delivered in the confirmed format and theme.
