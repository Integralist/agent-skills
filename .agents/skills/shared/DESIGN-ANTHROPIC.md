# Anthropic-inspired theme

Read only when this theme is selected. This is a local visual adaptation of
the supplied “Design SKILL Anthropic” notes, not an official design system.
Logo, trademark, and approval procedures are intentionally excluded.

**Direction.** Warm paper, near-black ink, quiet neutrals, and small clay,
blue, or green accents. Use flat surfaces, generous whitespace, and clear
hierarchy rather than gradients, glow, or heavy shadows.

**Palette.** The supplied notes give Dark `#141413`, Light `#faf9f5`,
mid gray `#b0aea5`, and light gray `#e8e6dc`. They list clay
`#d97757`, blue `#6a9bcc`, and green `#788c5d` with an unresolved
source caveat. Treat these as inspiration, not verified brand specifications.
Use accents for shapes; use contrast-tested text roles rather than assuming
an accent is safe for small text. Before choosing exact colours for any
medium, read [design-anthropic.css](design-anthropic.css), the canonical
local palette. Static slides use its light roles unless dark is requested.

**Type by medium.** For slides, posters, and editorial layouts, use Poppins
headings (Arial fallback) and Lora body (Georgia fallback). For dense HTML
interfaces, use a sans-serif UI stack; reserve serif for explanatory or
editorial passages. The notes name Anthropic Sans for product UI, but do not
assume access to that font. Use local fonts and stated fallbacks unless the
user approves fetching or embedding fonts.

**Interface craft.** Use 400 and 500 weights for compact widgets, 8px control
radii, and 12px card radii. Prefer bordered rows for dense lists. Keep layers
few and surface distinctions subtle; do not reduce text opacity. Use one
filled primary action per view, with secondary actions quieter. Decorative
outline icons stay secondary to labels; icon-only controls need accessible
names.

**Diagrams.** Colour by category, not position. Prefer two or three families:
purple, teal, or coral for categories; gray for neutral nodes. Reserve blue,
green, amber, and red for information, success, warning, and error. In light
mode, pair a pale fill with a dark label and mid-tone stroke; reverse the
lightness roles in dark mode. Title and subtitle need distinct text roles.
For large datasets, more series colours are acceptable with stable labels,
legends, and non-colour cues.

**Copy.** Be warm, direct, and unvarnished. Use sentence case, verb-first
buttons, helpful empty states, and errors that say what happened and what
to do next. Avoid promotional filler and decorative emoji.

**HTML implementation.** Embed [design-anthropic.css](design-anthropic.css)
as the palette and type source, following
[the HTML contract](DESIGN-HTML.md). It supplies light and dark roles.
The dark palette and contrast-adjusted accents are locally authored, not
published Anthropic or Claude Design System tokens. Do not copy host-only
token names, CDN restrictions, or widget geometry into standalone files.
