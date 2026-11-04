# HTML design contract

Read before building or changing HTML or web UI. The selected theme supplies
appearance; keep domain logic and layout local to the caller.

1. **Reuse the shared assets.** For standalone HTML, inline the selected
   theme CSS and [design.css](design.css) in that order. Add
   [design-charts.css](design-charts.css) only for charts or heatmaps.
   Embed [design-mode.js](design-mode.js) once, after the control exists.
   Generated files need no runtime access to the skills tree. Reuse an
   existing app's theme infrastructure instead when present, preserving this
   control and accessibility contract without adding a second controller.
2. **Expose the mode.** Set `data-design="anthropic"` or `"fastly"` on
   `<html>` and include `<meta name="color-scheme" content="light dark">`.
   Add a labelled native select with id `design-mode` and values
   `system`, `light`, and `dark`. System is the default and follows
   `prefers-color-scheme`; an explicit choice wins. The shared script sets
   `data-mode`, remembers the choice per theme when storage is available,
   and emits `designmodechange` for chart redraws. An explicit mode embedded
   in a saved file wins over stored preferences. Blocked storage must not
   prevent switching.
3. **Use semantic roles.** Take page, surface, text, muted, border, accent,
   on-accent, hover, and focus colours from the selected CSS's `--d-*`
   tokens. UI uses `--d-font-ui`, headings `--d-font-heading`, prose
   `--d-font-body`, and code `--d-font-code`. Keep content spacing and
   responsive layout local. Never replace all colours with an inversion
   filter. Photos and physical scenes retain their natural colours.
4. **Update every visual.** CSS and SVG should use role variables for text,
   fills, strokes, grids, tooltips, and controls. Canvas charts must resolve
   variables and redraw on `designmodechange`; do not reset selection,
   metric, zoom, focus, or pinned state. Re-render Mermaid from retained
   source with mode-appropriate theme variables. Use labels and line styles
   alongside colour; keep categorical series assignments stable across modes.

**Craft and checks.** Use semantic HTML, visible focus, accessible names,
adequate hit targets, and reduced-motion support. Check 320px and desktop
layouts, both modes, hover, focused controls, and chart labels. Where a chart
needs a wide coordinate space, contain its horizontal scrolling. For a
standalone offline artifact, embed all assets and avoid network fonts or
scripts. An existing report's documented CDN dependencies may remain; report
that it is not fully offline.

**Print.** Use a light canvas, readable ink, and no appearance control.
The shared CSS supplies print roles; keep report-specific print layout local.
For self-contained HTML exports, preserve the current `data-mode` attribute
and the embedded styles and controller.

**No exact host assumptions.** The supplied Anthropic notes include rules for
a hosted widget environment. A standalone page owns its canvas and controls;
it cannot depend on that host's prebuilt classes or private design tokens.
