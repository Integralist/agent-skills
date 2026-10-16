---
name: pdd
description: >-
  Write and gate a Product-Engineering initiative's Project, Discovery, and
  Design documents, one approval stage per run. Use when Product and
  Engineering need agreed scope, an evaluated solution direction, and an
  approved system design before engineering specs and plans.
disable-model-invocation: true
argument-hint: "[project path or milestone]"
metadata:
  model-tier: complex
---

# Project, Discovery, Design

Take a cross-functional initiative through three documents, each gated by the
one before: `project.md` agrees what the initiative is and its milestones,
`discovery.md` evaluates solution directions for one milestone, and
`design.md` records the approved system-level solution. Run one stage per run
and stop at its approval gate. These are Product-Engineering documents, so
they hold no code, specs, plans, or task lists.

**Approval is the user's.** Writing, formatting, or reviewing a document never
approves it. Set a stage `Awaiting approval` when it's ready, and record
`Approved` only after the user explicitly says so.

**Stop and ask.** Follow the source as given, but when something is missing,
contradictory, or looks like the wrong design, tell the user and wait. Don't
fill the gap with a guess.

**Milestones.** The first milestone may use `discovery.md` and `design.md`.
When a second arrives, rename those to `discovery-m1.md` and `design-m1.md`,
create the `-m2` files, and update every README link in the same change. When
several milestones are known from the start, use qualified names throughout.

1. **Find the project.** Use the path the user gives. Without one, look in
   `projects/` and ask which project when more than one fits; with none, ask
   for the initiative's name and create `projects/<yyyy-mm-dd>-<slug>/`. Read
   its README, every PDD document, and the research, specs, and ADRs they
   link. Done when you know each stage's status.

2. **Pick the stage:** the first that isn't `Approved`, in the order Project,
   Discovery, Design. If it's `Awaiting approval`, ask the user to approve it
   or request changes, and stop. A stage the user names needs every earlier
   stage approved. When all three are approved, hand off: use the architect
   skill from its Spec step, with the approved Design as the idea. Done when
   you have one stage and its milestone, or have handed off.

3. **Write the stage** from its template ([Project](../shared/PDD-PROJECT-TEMPLATE.md),
   [Discovery](../shared/PDD-DISCOVERY-TEMPLATE.md), or
   [Design](../shared/PDD-DESIGN-TEMPLATE.md)), keeping its headings and order
   and replacing every placeholder. Keep each document at its altitude:

   - **Project** says what the initiative must achieve and how it's staged, in
     words Product and Engineering share; technical approaches wait for
     Discovery. Ready when scope, milestones, outcomes, and requirements are
     specific enough to pick one milestone for Discovery, and what's out of
     scope is clear.
   - **Discovery** compares credible options for one milestone against the
     Project's requirements, with a solution matrix when there are real
     alternatives. It stays implementation-agnostic: no APIs, schemas, or task
     sequences. Ready when the trade-offs are recorded and the direction is
     chosen or narrowed.
   - **Design** is the blueprint for the approved Discovery direction: which
     components change, how they interact, and how success is measured. It may
     name technologies, but not slices, interface contracts, or tasks. Ready
     when reviewers can authorize implementation without reopening the
     rejected options.

   When revising, keep approved content and record the requested changes
   rather than rewriting the history. If the work turns up a code, tooling, or
   `docs/specs/` change, stop: that needs its own engineering project. Done
   when the document is `Awaiting approval`.

4. **Update the README** as [PROJECTS-README.md](../shared/PROJECTS-README.md)
   describes: the artifact rows, the PDD approval table, and the next action.
   Done when the README matches the documents.
