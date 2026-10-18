---
name: teach-with-slides
description: >-
  Teach a topic or concept through a visual, beginner-friendly slide deck. Use
  when the user asks to learn or explain something as slides.
disable-model-invocation: true
argument-hint: Optional topic to teach
metadata:
  model-tier: complex
---

# Teach With Slides

Make a short, warm slide deck that teaches one idea clearly without watering
it down. Write for the learner as [voice-product](../voice-product/SKILL.md)
describes, connecting each concept's mechanics to why it matters to them.

1. **Choose the topic** from the argument or the conversation, and ask if
   neither gives one. Done when the deck has one main idea.
2. **Confirm the format and theme** before building. Offer PDF (easy to
   share, hard to edit), PPTX (editable, may need a code-based generator),
   Google Slides (depends on access), or HTML (a browser deck); if the user
   already named one, restate it for confirmation. Offer the Claude-inspired
   theme as the default and Fastly-inspired as an informal option, and accept
   any other theme or format the available tools support. Done when the user
   has confirmed both.
3. **Set the level** from what the conversation says about the audience, or
   write for a curious general audience. Ask about audience, length, or goal
   only when the answer would change the deck materially; otherwise assume,
   and list the assumption at the end. Done when you know who it's for.
4. **Build the arc:** a relatable hook or question, the core mental model,
   the ideas in a useful order, and a recap or quick check for
   understanding, in roughly 6–10 slides unless the user or topic needs
   another length. Done when the outline follows that arc.
5. **Ground it.** Prefer sources the user supplied or authoritative
   references, cite factual claims compactly on their slides, and add a
   source list when useful. Mark analogies, simplifications, and assumptions
   as such, and never present an invented statistic, quotation, or example
   as real. Done when every factual claim has a source.
6. **Produce and inspect** the deck in the confirmed format and theme,
   checking for legibility, clipping, broken diagrams, and consistent
   structure. Ask before adding dependencies or changing project code to
   produce it. If the format can't be produced with the available tools, say
   why and offer an alternative before switching. Done when the deck passes
   inspection.
7. **Deliver** the path or link, with any assumptions, style deviations, or
   missing assets in your message rather than on the slides. Done when the
   user has the deck.

**Slides.** One idea per slide, in short phrases with sparse bullets,
generous whitespace, and a clear hierarchy. Use a warm, encouraging voice that
invites rather than talks down, define technical terms on first use, and
prefer concrete examples, following
[ANALOGY-GUIDANCE.md](../shared/ANALOGY-GUIDANCE.md) for analogies. Add a
small knowledge check where it reinforces learning, never at the cost of the
explanation.

**Diagrams.** Use Mermaid when a flow, hierarchy, cycle, timeline, or
relationship makes the idea easier to see, choosing the smallest diagram that
does it and following [conventions-mermaid](../conventions-mermaid/SKILL.md).
Render diagrams into the deck's format, and keep standalone Mermaid source or
images only when the user asks or the deck needs them to be reproduced.

**Claude-inspired theme (default).** Warm oranges, beiges, and browns with
strong text contrast and restrained accents. It's a design direction, not an
official Anthropic palette, so imply no endorsement or brand compliance.

**Fastly-inspired theme (informal).** For quick decks for Fastly colleagues,
built from scratch unless the user asks for an authorised template. It's a
visual reference, not official collateral, so legibility and teaching come
before brand fidelity, and the deck never carries an approval label. Use one
theme per deck unless the user asks for a hybrid.

- **Colour:** Fastly Red `#FF282D` for accents only, never large areas of
  body text, with icon blue `#0073EB`, white, and black. Tints can separate
  chart elements; mention unusual colour choices in your message.
- **Type and icons:** Inter Tight at normal weight, and Google Material
  Symbols at weight 300, grade 200, optical size 48, rendered at 50, in blue,
  white, or black.
- **Layouts:** title, agenda, speaker intro, meet the team, numbered section
  break (`01`), content with or without subtitle, content with photo,
  full-width image or diagram, two- to four-panel, 4 or 6 tiles, big stat,
  big statement, customer quote, case study, 4x4 or 5x5 table, Q1–Q4
  timeline, Q&A, and thank you. Adapt one when the topic needs it. Keep to
  four bullets or fewer per slide.
- **Leave out** the copyright footer unless asked (then `©<current year>
  Fastly, Inc.` on every content slide), any logo the user hasn't supplied
  or confirmed as approved, invented customer names, retired Signal Sciences
  branding, gradients, drop shadows, and clip art.
