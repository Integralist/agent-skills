---
name: to-plan
description: >-
  Write an implementation plan of slices and milestones from a spec or a
  session's discussion. Use when creating a feature plan, saving a plan
  discussed in chat, or when another skill needs a plan.
argument-hint: "[source path]"
metadata:
  model-tier: complex
---

# To Plan

Turn a source (a file or this session's discussion), and its spec if one
exists, into `plan.md`: ordered vertical slices, each with the outcomes it
must reach, the slices it waits on, and the exact interfaces it shares with
its neighbours. Plan outcomes, not steps; the to-tasks skill later turns one
slice at a time into tasks against live code. Write the plan; don't build it.

**Stop and ask.** Follow the source as given, but when something is missing,
contradictory, or looks like the wrong design, tell the user and wait. Don't
fill the gap with a guess.

1. **Pick the source.** Use the file the user names. With none, use this
   session's discussion: capture the plan worked out there rather than
   starting over. Use the spec the user or calling skill names, or `spec.md`
   in the source's project folder; plan without one when neither exists. If
   the source names a spec you can't find, ask for its path. Done when you
   know the source and whether there's a spec.

2. **Read what it touches.** Read the spec if there is one, any research the
   source links, and the code the plan will change. Load the convention skills
   for each language the signatures use. Done when you know the existing
   interfaces the slices build on.

3. **Slice the work.** Cut vertical slices: each a tracer bullet through every
   layer it touches, demoable on its own, and small enough for one session.
   For single-layer or non-code work, use one flat `#### Milestones` list. For
   a wide rename, use expand–contract: add the new form, migrate call sites in
   slices, then remove the old form.

   - Give each slice `Blocked by`, and `Consumes`/`Produces` with exact
     signatures. A slice's implementer sees only its own section, so this is
     how it learns its neighbours' names and types.
   - Give each slice milestones: verifiable outcomes keyed `M<slice>.<n>`. A
     milestone says what is true when done ("empty input returns
     `ErrEmpty`"), not which files change. With a spec, link the criteria
     each milestone meets; without one, the milestone's own wording is the
     criterion, so make it checkable. Never renumber a key once assigned; task
     lists and execution logs refer to it.
   - Choose focused outcome diagrams using
     [OUTCOME-DIAGRAMS.md](../shared/OUTCOME-DIAGRAMS.md): individual, shared,
     mixed, or none according to what helps the reviewer understand the change.
   - Choose the delivery shape as
     [PULL-REQUEST-DELIVERY.md](../shared/PULL-REQUEST-DELIVERY.md) describes,
     naming slices or milestones, not task numbers.

   Done when every requirement in the spec, or in the source without one, maps
   to a milestone, and every name is spelled the same in every slice.

4. **Write the plan** to `plan.md` in the spec's project folder, or a new
   `projects/<yyyy-mm-dd>-<slug>/` when there's no spec, filling the template
   below. Fill the header from `date +%F` and `git config user.name`, with
   Status `Planning`. Write the Summary and each slice's Delivers with the
   voice-product skill, so a reader sees what is built, for whom, and why. Add
   the plan to the project README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when the
   file is written and you've shared its path.

````markdown
# {Feature} — Plan

- **Status:** Planning
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language, or N/A}
- **Spec:** {[spec](./spec.md), or "None — criteria live in the milestones"}

## Summary

{Two or three reader-facing sentences: the problem, what changes for whom,
and why it matters.}

{Optional shared outcome diagram: caption the covered slice or milestone IDs,
then a fenced Mermaid block. Omit when better covered within Implementation.}

## Prerequisites

{Services, libraries, tools, or config needed first, or "None".}

## Pull Request Delivery

{Mode and layer table, per PULL-REQUEST-DELIVERY.md.}

## Implementation

### Slice 1: {what it delivers end to end}

- **Blocked by:** None
- **Delivers:** {observable behaviour}
- **Consumes:** None
- **Produces:** {exact signatures later slices rely on}

{Optional focused outcome diagram for Slice 1, captioned with its ID. Omit
when covered by a shared diagram or clearer without one.}

```{language}
{key signatures}
```

#### Slice 1 Milestones

- [ ] **M1.1**: {checkable outcome}{ — [criterion](./spec.md#anchor), when there's a spec}

### Slice 2: {what it delivers end to end}

- **Blocked by:** Slice 1 ({why})
- **Delivers:** {observable behaviour}
- **Consumes:** {signatures from Slice 1}
- **Produces:** {exact signatures, or None}

{Optional focused outcome diagram for Slice 2, captioned with its ID. Omit
when covered by a shared diagram or clearer without one.}

#### Slice 2 Milestones

- [ ] **M2.1**: {checkable outcome}{ — [criterion](./spec.md#anchor), when there's a spec}

### Documentation

- [ ] {Living spec `docs/specs/<capability>.md` to seed or update}
- [ ] {README or `docs/` page whose behaviour or usage changes}

## File Changes

| File     | Change         |
| -------- | -------------- |
| `{path}` | {what and why} |

## Notes

- {Risks, open questions, unverified assumptions.}
````
