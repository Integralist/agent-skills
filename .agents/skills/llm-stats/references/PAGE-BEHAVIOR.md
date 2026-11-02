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
selected, plotted models with a bright yellow line. It dims other nodes and
family curves. Only frontier nodes respond to the mouse, with tighter hit
areas; keyboard focus and pin remain available for every model. It updates
with selection and metric changes, and survives bookmarks and saved HTML. A
revealed family does not re-enable its non-frontier mouse targets or dim other
frontier nodes. Faded nodes, family curves, and effort labels cannot intercept
the mouse. Switching the checkbox off restores normal styling and mouse
access to every model.
- Reports and exports keep the API's index version, and cost tooltips keep
four decimal places.
