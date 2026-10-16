# ADR Format

How to decide on, write, number, and file an Architecture Decision Record, so
every ADR in a repository reads the same whichever skill wrote it.

**When to write one.** All three must hold:

1. **Hard to reverse:** changing your mind later costs meaningfully.
2. **Surprising without context:** a future reader would wonder "why this
   way?"
3. **A real trade-off:** genuine alternatives existed, and one was picked for
   stated reasons.

If any fails, write nothing and say which. Decisions that usually qualify:
architectural shape, integration patterns between contexts, technology choices
with lock-in, boundary and ownership rules, deliberate deviations from the
obvious path, constraints the code can't show, and rejections someone would
otherwise re-propose.

**Template.** Write Context and Consequences with the voice-product skill;
keep the decision, the options, and the constraints precise. When the source
doesn't cover a section, write `_Not specified in source._` rather than
inventing it. Use `Proposed` while the plan is tentative and `Accepted` once
it's committed.

````markdown
# {Short decision title}

- **Status:** {Proposed | Accepted | Deprecated | Superseded by ADR-NNNN}
- **Date:** {date +%F}
- **Deciders:** {git config user.name}
- **Source:** {link to the plan, spec, or discussion}

## Context

{The forces: problem, constraints, and requirements that make the decision
necessary. Cite each.}

## Decision

{The choice, in active voice: "We will …".}

## Options Considered

- **{Option A (chosen)}** — {why it won}
- **{Option B}** — {why it was rejected}

## Consequences

{What gets easier, what gets harder, follow-on work, and risks.}
````

**Where it goes.** A project decision goes in `projects/<slug>/ADR-<NNNN>.md`
and in that project's README. A system-wide decision goes in
`docs/adr/ADR-<NNNN>.md`. The filename is the ID only and the title lives in
the heading, so renaming a decision never moves its file.

**Registry.** `docs/adr/README.md` has one row per ADR, wherever the ADR
lives. Create it, and `docs/adr/`, with the repository's first ADR.

```md
| ID | Summary | File |
| --- | --- | --- |
| ADR-0001 | {Concise summary} | [{Decision title}](../../projects/{project}/ADR-0001.md) |
```

**Numbering.** IDs are repository-wide and zero-padded.

1. **Migrate legacy files first.** Find ADRs under every `docs/adr/` and
   `projects/` folder, completed projects included. Keep `ADR-<NNNN>.md`
   files as they are. Rename a legacy numbered file such as `0001-title.md`
   to `ADR-0001.md`, keeping its ID. Give an unnumbered ADR the next unused
   ID, in repository-path order. If two files claim one ID, or you can't tell
   whether a file is an ADR, stop and ask. Update every local link, the
   project READMEs, and the registry in the same change, and tell the user
   that external links to renamed files may break.
2. **Assign new IDs:** one more than the highest ID in the registry or the
   files, consecutive in source order. If the registry and files disagree,
   take the highest and repair the registry. Never reuse a gap.
3. **Resolve collisions before merging.** IDs in an open PR are provisional.
   After updating from the target branch, if another PR merged the same ID,
   take the next free one and update the filename, links, and registry. Once
   merged, an ID never changes.
