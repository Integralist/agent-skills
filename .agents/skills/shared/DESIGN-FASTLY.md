# Fastly-inspired theme

Read only when explicitly selected. This is an informal adaptation of the
supplied “Design SKILL Fastly” notes, not Fastly-approved collateral or an
implementation of Aspen or Beacon. Exclude logos, copyright footers,
corporate slogans, template requirements, and approval workflows.

**Direction.** Red-led emphasis, white or warm-gray space, near-black text,
friendly rounded containers, and confident, clear hierarchy. Use red for a
headline rule, section marker, key shape, or primary action; avoid covering
dense content in red.

**Palette and provenance.** The notes describe Platform Red, White, Black,
warm grays, and secondary colours for data and illustration, but explicitly
provide no verified digital hex values. The values in
[design-fastly.css](design-fastly.css) are a locally chosen palette, including
the red; do not call them official Platform Red or Aspen tokens. Before
choosing exact colours for any medium, read that CSS as the canonical local
palette. Static slides use its light roles unless dark is requested. Light mode
uses warm-white surfaces and a deep-red action. Dark mode uses charcoal
surfaces, warm-white text, and a lighter red action. Both modes are local
adaptations; the supplied notes do not establish an official dark theme.

**Typography.** Use ES Rebond Grotesque Classic for headlines when already
available, otherwise Inter Bold. Use Inter Regular for body, controls, and
navigation, with Inter Medium for emphasis. Fall back to Arial or the system
sans-serif stack. Use Noto Sans JP for Japanese when available. Allow extra
space for translations rather than clipping or shrinking text to fit. Do not
fetch commercial fonts or assume a corporate template is installed.

**Visuals.** Prefer flat solid fills with outlined details, friendly corners,
simple geometry, and sparse line-and-dot connections. Abstract speed lines
may support a performance topic, but do not recreate a company mark. Use
neutral text; secondary chart colours belong to shapes and series, not body
copy. Keep diagrams labelled and category colours stable.

**Icons and imagery.** Prefer an existing icon set or Material outline
symbols; avoid inventing product-logo icons. Use white rounded containers
where an icon needs separation from a coloured surface. Choose natural,
warm-but-not-filtered photography rather than staged, vintage, or HDR images.
Use images only when they help explain the subject.

**Copy and layout.** Use sentence case, active voice, and short labels.
Keep the teaching voice welcoming and the hierarchy clear. Skip exclamation
marks and slogans. Subject matter never needs to mention Fastly just because
this theme was selected.

**HTML implementation.** Embed the palette and follow
[the HTML contract](DESIGN-HTML.md). Keep this theme separate from the
Anthropic palette; do not make a hybrid unless the user requests it.
