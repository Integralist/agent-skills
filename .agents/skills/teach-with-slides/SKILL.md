---
name: teach-with-slides
description: >-
  Teach a topic or concept through a visual, beginner-friendly slide deck.
disable-model-invocation: true
argument-hint: Optional topic to teach
---

Create a concise, warm, educational slide deck that helps the user understand a
topic. Make learning clear and enjoyable without watering down important ideas.

## Workflow

1. **Choose the topic.** Use the topic supplied with
   `/teach-with-slides`, or infer it from the current conversation. If neither
   gives a clear topic, ask the user what they want to learn. Keep the deck
   focused on one main idea.
2. **Confirm the deliverable.** Before generating the deck, ask the user to
   confirm the output format. Offer PDF, PPTX, Google Slides, or HTML, and
   briefly explain the trade-off: PDF is easy to share but not readily editable;
   PPTX is editable and may need a code-based generator; Google Slides depends
   on available access; HTML works as a browser-based deck. If the user already
   specified a format, restate it for confirmation rather than asking them to
   choose again. Show Claude-inspired as the default and offer Fastly-inspired
   as an informal style option, not official Fastly collateral. Accept a
   requested theme or format not in the list if the available tools support it.
3. **Set the learning level.** Use audience and prior knowledge already present
   in the conversation. Otherwise, write for a curious general audience. Ask
   about audience, length, or learning goal only when the answer would
   materially change the deck; otherwise make a reasonable assumption and list
   it at the end.
4. **Build a learning arc.** Start with a relatable hook or question, introduce
   the core mental model, explain ideas in a useful order, and finish with a
   recap or a short check-for-understanding. Keep a short deck to roughly 6–10
   slides unless the user asks for another length or the topic needs more.
5. **Ground the teaching.** Use trustworthy sources for claims that need
   verification. Prefer sources the user supplied or authoritative references.
   Cite factual claims on the relevant slides with compact citations and include
   a source list when useful. Distinguish established facts from analogies,
   simplifications, and assumptions. Never invent statistics, quotations, or
   examples presented as real.
6. **Design and produce.** Apply the selected theme, use diagrams where they
   make an idea easier to see, and create the confirmed format with available
   tools. Inspect the finished deck for legibility, clipping, broken diagrams,
   and consistent slide structure. Do not add dependencies or change project
   source code just to produce a deck without asking first. If the chosen format
   cannot be produced with available tools, explain the limitation and offer a
   workable alternative before switching formats.
7. **Report the result.** Give the output path or link and summarize relevant
   assumptions, style deviations, or unavailable assets in the delivery
   message. Keep review notes out of audience-facing slides.

## Teaching and slide design

- Use a warm, encouraging voice. Explain technical terms when they first
  appear, prefer concrete examples and analogies, and make the learning feel
  inviting rather than childish.
- Give each slide one main idea. Use short phrases, sparse bullets, generous
  whitespace, and a clear visual hierarchy. Avoid paragraphs and unexplained
  jargon.
- Use diagrams, comparisons, and examples to reveal relationships that prose
  would make harder to follow. Include a small knowledge check when it helps
  reinforce learning; never let an activity crowd out the explanation.
- Treat Claude-inspired as a design direction, not an official brand palette:
  use warm oranges, beiges, and browns with readable contrast and restrained
  accents. Do not imply endorsement or exact brand compliance.
- Use the user's theme choice consistently. Do not mix Claude-inspired styling
  with Fastly styling unless the user asks for a hybrid.

## Mermaid diagrams

Use Mermaid when a flow, hierarchy, cycle, timeline, or relationship makes the
concept easier to understand. Choose the smallest useful diagram; do not add a
diagram just to decorate a slide. Keep labels short and structure the diagram
for a readable shape. For process diagrams, group meaningful phases and show
parallel paths instead of forcing independent steps into one long chain.

Before authoring or validating Mermaid, read
[`../conventions-mermaid/SKILL.md`](../conventions-mermaid/SKILL.md) and follow
its syntax, layout, and validation guidance. For choosing the simplest useful
visual, consult [`../show-me/SKILL.md`](../show-me/SKILL.md). Render diagrams
into the confirmed slide format using its supported workflow; keep standalone
Mermaid source or image files only when the user asks for them or they are
needed to reproduce the deck.

## Themes

### Claude-inspired default

Use a warm, calm palette based on oranges, beiges, and browns. Keep text and
background contrast strong. This is an inspired visual direction, not a claim
that the deck follows an official Anthropic or Claude Code style guide.

### Fastly-inspired (informal)

Use this option for quick presentations intended for Fastly colleagues. It is
Fastly-inspired, not official or approved Fastly collateral. Build from scratch
by default; use an authorized template only if the user asks. Treat the supplied
guidance below as a visual reference, prioritizing legibility and teaching
over exact brand fidelity.

- Prefer Fastly Red `#FF282D`, icon blue `#0073EB`, white `#FFFFFF`, and black
  `#000000`. Use red for accents, not large areas of body text. Tints can help
  distinguish chart or diagram elements; summarize unusual colour choices in
  the delivery message, not as on-slide warnings.
- Prefer Inter Tight, normal weight, for body text and bullets; use it for
  headings when available. This is a style preference, not a claim of
  Brandguide compliance.
- Use Google Material Symbols for icons with weight 300, grade 200, optical
  size 48, and rendered size 50. Prefer blue, white, or black icons.
- Omit the Fastly copyright footer by default so the deck does not suggest
  official collateral. If requested, add `©<current year> Fastly, Inc.` to
  every content slide; determine the year when generating the deck.
- Prefer these layouts: Title, Agenda, Speaker intro, Meet the team, Numbered
  section break (`01`), Content with subtitle, Content without subtitle,
  Content with photo, Full-width image or diagram, Double/triple/quadruple
  panel, 4 or 6 tiles, Big stat, Big statement, Customer quote, Case study,
  Table (4x4 or 5x5), Timeline (Q1–Q4), Q&A, and Thank you. Adapt a layout
  when needed to teach the topic clearly.
- Use one topic per slide, short phrases, no more than four bullets per slide,
  and generous whitespace.
- Never invent statistics, customer names, or quotations. Use a logo only when
  the user supplies an authorized asset or confirms an available asset is
  approved; otherwise omit it and note any missing asset in the delivery
  message. Never add an approval label to a slide.
- Avoid retired Signal Sciences branding, gradients, drop shadows, and
  decorative clip art.
- List assumptions and style deviations in the delivery message, not as
  audience-facing slide labels.
