# HTML Report Format

Render the architecture review as one self-contained HTML file, with Tailwind
and Mermaid from CDNs as its only scripts and nothing interactive beyond
Mermaid's rendering. The diagrams carry the weight; prose is sparse and uses
the [code-module-design](../code-module-design/SKILL.md) glossary exactly,
reaching for one of its terms before inventing another.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review for {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

**Header.** Repo name, date, and a compact legend (solid box = module, dashed
line = seam, red arrow = leakage, thick dark box = deep module), then straight
into the candidates with no introduction.

**Candidate card,** one `<article>` each:

- **Title** naming the deepening, such as "Collapse the Order intake
  pipeline".
- **Badges:** strength (`Strong` emerald, `Worth exploring` amber,
  `Speculative` slate) and the dependency category (`in-process`,
  `local-substitutable`, `ports & adapters`, `mock`).
- **Files** in `font-mono text-sm`.
- **Before/after diagram,** the centrepiece, in two columns side by side.
- **Problem** and **Solution,** one sentence each.
- **Wins,** six words or fewer each, naming the gain in glossary terms:
  "locality: bugs concentrate in one module", "Delete 4 shallow wrappers",
  not "easier to maintain".
- **ADR callout,** when one applies: one line in an amber-tinted box.

If a diagram needs a paragraph to be understood, redraw the diagram.

**Top recommendation.** One larger card: the candidate's name, one sentence
on why, and an anchor link to its card.

## Diagram patterns

Vary them across candidates, mixing Mermaid with hand-built visuals so the
report doesn't look generic.

- **Mermaid flowchart or graph** for "X calls Y calls Z, and look at the
  mess", in a Tailwind card, with `classDef` colouring leaking edges red and
  the deep module dark. A sequence diagram suits "before: 6 round-trips;
  after: 1".

  ```html
  <div class="rounded-lg border border-slate-200 bg-white p-4">
    <pre class="mermaid">
      flowchart LR
        A[OrderHandler] --> B[OrderValidator]
        B --> C[OrderRepo]
        C -.leak.-> D[PricingClient]
        classDef leak stroke:#dc2626,stroke-width:2px;
        class C,D leak
    </pre>
  </div>
  ```

- **Hand-built boxes and arrows** when Mermaid's layout fights you: modules
  as bordered `<div>`s, arrows as inline SVG over a relative container. Use
  it for an "after" that should read as one thick-bordered deep module with
  greyed-out internals.
- **Cross-section** for layered shallowness: stacked bands (`h-12
  border-l-4`), six thin do-nothing layers before, one thick labelled band
  after.
- **Mass diagram** for an interface as wide as its implementation: two
  rectangles per module, nearly equal before, a short interface over a tall
  implementation after.
- **Call-graph collapse:** a tree of nested call boxes before, one box with
  the now-internal calls faded inside it after.

## Style

- Editorial rather than corporate dashboard: generous whitespace, with
  `font-serif` headings an option against stone and slate.
- One accent colour (emerald or indigo), plus red for leakage and amber for
  warnings.
- Diagrams about 320px tall, so before and after sit side by side without
  scrolling.
- Module labels in `text-xs uppercase tracking-wider`, so they read as
  schematic rather than UI.
- Plain, direct sentences, bullets over sentences, in this register:
  "Order intake module is shallow: interface nearly matches the
  implementation." "Pricing leaks across the seam." "Two adapters justify the
  seam: HTTP in prod, in-memory in tests."
