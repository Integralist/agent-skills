# HTML report format

Read after [design](../../design/SKILL.md) and its selected theme and HTML
guidance. They own visual rules, appearance switching, and inspection; this
reference owns architecture-review content.

Render one HTML file with sparse prose and diagrams carrying the explanation.
The existing Tailwind and Mermaid CDN dependencies may remain; say that the
report needs network access rather than claiming it works offline. Inline
the shared theme, foundations, and mode controller. Apart from appearance
switching and Mermaid rendering, keep the report static. Retain Mermaid source
and re-render on mode changes so labels, fills, and arrows stay readable.

Use the [code-module-design](../../code-module-design/SKILL.md) glossary
exactly, reaching for an existing term before inventing another.

**Header.** Repo name, date, and a compact legend (solid box = module, dashed
line = seam, labelled leakage arrow, thick-bordered box = deep module), then
straight into candidates without an introduction. Give leakage a labelled
danger role and strength a text label so colour is never the only signal.

**Candidate card,** one `<article>` each:

- **Title** naming the deepening, such as “Collapse the Order intake
  pipeline”.
- **Badges:** strength (`Strong`, `Worth exploring`, or `Speculative`)
  and dependency category (`in-process`, `local-substitutable`,
  `ports & adapters`, or `mock`).
- **Files** in small monospace text.
- **Before/after diagram,** the centrepiece, in two columns on wide screens
  and stacked on narrow screens.
- **Problem** and **Solution,** one sentence each.
- **Wins,** six words or fewer each, naming the gain in glossary terms:
  “locality: bugs concentrate in one module”, “Delete 4 shallow wrappers”,
  not “easier to maintain”.
- **ADR callout,** when one applies, in a labelled warning treatment.

If a diagram needs a paragraph to be understood, redraw it.

**Top recommendation.** One larger card: the candidate's name, one sentence
on why, and an anchor link to its card.

## Diagram patterns

Vary patterns across candidates, mixing Mermaid with hand-built visuals.

- **Flowchart or graph** for “X calls Y calls Z, and look at the mess”.
  A sequence diagram suits “before: 6 round-trips; after: 1”.
- **Hand-built boxes and arrows** when Mermaid's layout fights you: modules
  as bordered containers, arrows as inline SVG. An “after” can be one
  thick-bordered deep module with quieter, still-readable internals.
- **Cross-section** for layered shallowness: six thin do-nothing bands
  before, one thick labelled band after.
- **Mass diagram** for an interface as wide as its implementation: two
  rectangles per module, nearly equal before, a short interface over a tall
  implementation after.
- **Call-graph collapse:** nested call boxes before, one box with the
  now-internal calls quieter inside it after.

Aim for diagrams about 320px tall, adjusting to keep labels legible.
Use sentence-case labels and the selected theme's roles, not hardcoded
colours or a second style system. Keep sentences plain and direct:
“Pricing leaks across the seam.” “Two adapters justify the seam: HTTP in
prod, in-memory in tests.”
