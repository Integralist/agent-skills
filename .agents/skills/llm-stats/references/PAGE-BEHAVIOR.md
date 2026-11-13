# Page behaviour

These behaviours are covered by the tests and must be preserved when changing
the page.

- Hovering or focusing an effort node highlights its family. The normal view
dims other families; Pareto mode keeps frontier nodes vivid. Clicking or
Enter/Space pins it, clicking another replaces the pin, and clicking it again,
Escape, or **Clear highlight** releases it.
- The model dropdown has fuzzy search, checkboxes, Clear, Select matches, and
Reset defaults, with arrow keys to move and Escape to close.
- Models missing the chosen score or metric are left out with a visible
warning naming each one and what it lacks, updated as selections change. Zero
is a value, not a gap.
- **Pareto line**, off by default, overlays the non-dominated trade-offs among
selected, plotted models with a bright yellow line. A recommendation row beneath
the legend and above the plot lists every frontier model and effort from left
to right; cost charts read from highest to lowest task cost. It includes models
sharing a frontier coordinate and hides when Pareto is off or no data is plotted.
It dims other nodes and family curves. Only frontier nodes respond to the mouse,
with tighter hit areas; keyboard focus and pin remain available for every model.
It updates with selection and metric changes, and survives bookmarks and saved
HTML. A revealed family does not re-enable its non-frontier mouse targets or
dim other frontier nodes. Faded nodes, family curves, and effort labels cannot
intercept the mouse. Switching the checkbox off restores normal styling and
mouse access to every model.
- Family names appear only in the color-coded legend above the plot, outside
  the data area, so they cannot cover lines or nodes.
- The **Download PNG** icon button has the accessible name **Download PNG**. It
  exports the current graph with its active theme and is disabled when no graph
  is available; encoding failures produce a visible status message.
- Reports and exports keep the API's index version, and cost tooltips keep
four decimal places.
