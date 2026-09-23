# ADR Format

ADRs use repository-wide, zero-padded IDs and ID-only filenames:
`ADR-0001.md`, `ADR-0002.md`, etc. This applies to system-wide,
project-scoped, and context-specific ADRs, wherever they live.

Keep the decision title in the document heading. The ID is a stable, concise
reference; the filename does not duplicate the title, so it stays stable if the
title changes. Use descriptive link text when the topic needs context.

Create the root `docs/adr/` directory and its `README.md` registry lazily —
with the first ADR anywhere in the repository.

## Template

````md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
````

That's it. An ADR can be a single paragraph. The value is in recording
*that* a decision was made and *why* — not in filling out sections.

## Optional sections

Only include these when they add genuine value. Most ADRs won't need them.

- **Status** frontmatter with `proposed`, `accepted`, `deprecated`, or
  `superseded by ADR-NNNN` — useful when decisions are revisited.
- **Considered Options** — only when the rejected alternatives are worth
  remembering.
- **Consequences** — only when non-obvious downstream effects need to be called
  out.

## Registry and numbering

Maintain a repo-wide index at `docs/adr/README.md` with one row for every ADR,
regardless of whether the ADR lives in `docs/adr/`, a project, or a
context-specific directory:

| ID | Summary | File |
| --- | --- | --- |
| ADR-0001 | {Concise summary} | [Decision title][adr-0001] |

[adr-0001]: ../../projects/{project}/ADR-0001.md

The index lets readers find a decision from its ID without opening every ADR.
Keep summaries concise and link to the source files.

### Migrate existing ADRs

Before creating a new ADR, inventory ADR documents under `docs/adr/`, nested
context-specific `docs/adr/` directories, and `projects/`, including completed
projects. Then migrate every noncanonical filename. Reserve IDs already used by
canonical files, numeric legacy filenames, or the index before assigning IDs to
unnumbered ADRs:

- Keep `ADR-<NNNN>.md` files and their IDs unchanged.
- For a legacy filename with a unique numeric ID, such as `0001-title.md`,
  preserve the ID and rename it to `ADR-0001.md`.
- For an unnumbered ADR, assign the next unused ID. When migrating several,
  assign IDs in repository-path order; IDs identify decisions, not chronology.
- If existing ADRs claim the same ID or a file's status as an ADR is unclear,
  stop and ask rather than guessing or silently renumbering.

Update repository-local links and cross-references, project READMEs, and the
index in the same change. Tell the user that external links to renamed paths
may need manual updates. Do not leave legacy filenames or `Legacy` rows in the
completed index.

### Assign IDs and handle collisions

After migration, read the index and scan the repository for existing
`ADR-<NNNN>.md` files. Use one greater than the highest ID found in either
place. For multiple new ADRs, assign consecutive IDs in source order. If the
index and files disagree, use the highest existing ID and repair the index.
Never reuse gaps or renumber an ADR after it has merged.

IDs in open PRs are provisional, not reserved. Parallel PRs can choose the
same next ID. After updating from the target branch, check for collisions; the
PR with the collision must take the next available ID and update its filename,
references, and index before merging. The merged ID then remains permanent.

Put the topic in the document heading and in descriptive link text, not in the
filename. The ID is the stable, concise reference and does not change when a
title changes.

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful.
2. **Surprising without context** — a future reader will look at the code and
   wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you
   picked one for specific reasons.

If a decision is easy to reverse, skip it — you'll just reverse it. If it's
not surprising, nobody will wonder why. If there was no real alternative,
there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is
  event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate
  via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth
  provider, deployment target. Not every library — just the ones that would take
  a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer
  context; other contexts reference it by ID only." The explicit no-s are as
  valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL
  instead of an ORM because X." Anything where a reasonable reader would assume
  the opposite. These stop the next engineer from "fixing" something deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of
  compliance requirements." "Response times must be under 200ms because of the
  partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered
  GraphQL and picked REST for subtle reasons, record it — otherwise someone will
  suggest GraphQL again in six months.
