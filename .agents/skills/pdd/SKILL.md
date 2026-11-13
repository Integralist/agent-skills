---
name: pdd
description: >-
  Write and gate a Product-Engineering initiative's Project, Discovery, and
  Design documents, one approval stage per run. Use when Product and
  Engineering need agreed scope, an evaluated solution direction, and an
  approved system design before engineering specs and plans.
disable-model-invocation: true
argument-hint: "[project path | github | #<issue> | milestone]"
metadata:
  model-tier: complex
---

Guide a cross-functional initiative through three approval-gated documents:
`project.md` defines the initiative and milestones, `discovery.md` evaluates
solution directions for one milestone, and `design.md` records the approved
system-level solution. Run only one stage per invocation, then stop at its
approval gate. These Product-Engineering documents do not contain code, specs,
plans, or task lists.

**Approval belongs to the user.** Writing, formatting, or reviewing a
document never approves it. Mark a ready stage `Awaiting approval`; mark it
`Approved` only after the user explicitly approves it.

**Critique before alignment.** Before grilling each stage, have a separate
read-only reviewer follow the [critique skill](../critique/SKILL.md) on its
draft. Use [grill-with-docs](../grill-with-docs/SKILL.md) for alignment,
bring in the findings, and incorporate agreed changes. If the grill materially
changes the draft, critique it again. Mark a ready stage
`Awaiting approval` only after critique findings are resolved and the user
confirms shared understanding; neither the critique nor the grill is approval.

**Stop rather than guess.** Follow the source as given. If information is
missing or contradictory, or the design seems wrong, explain the issue and
wait for the user.

**Milestone filenames.** The first milestone may use `discovery.md` and
`design.md`. When a second milestone arrives, rename these to
`discovery-m1.md` and `design-m1.md`, create the `-m2` documents, and update
all README links in the same change. If multiple milestones are known from
the start, use qualified names throughout.

1. **Find the project.** Use the supplied path. Otherwise look in `projects/`
   and ask which project if more than one fits. If none exists, ask for the
   initiative's name and create `projects/<yyyy-mm-dd>-<slug>/`. Read its
   README, every PDD document, and all research, specs, and ADRs they link.
   Also read the project root `GLOSSARY.md`; if absent, use root `CONTEXT.md`
   as its legacy equivalent. Keep PDD milestones distinct from slice
   milestones in engineering plans.
   For `github` or an issue reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and Issue
   Artifacts instead of `projects/`.
2. **Choose one stage.** Take the first stage not marked `Approved`, in order:
   Project, Discovery, Design. If it's `Awaiting approval`, ask the user to
   approve it or request changes, then stop. A user-named stage requires all
   earlier stages to be approved. If all three are approved, hand off to
   architect at its Research step, using the approved Design as the idea.
3. **Write the stage** from the matching template, keeping its headings and
   order and replacing every placeholder:
   [Project](../shared/PDD-PROJECT-TEMPLATE.md),
   [Discovery](../shared/PDD-DISCOVERY-TEMPLATE.md), or
   [Design](../shared/PDD-DESIGN-TEMPLATE.md).

   Keep each document at its proper level:
   - **Project:** State shared goals and milestones without choosing
     technical approaches. Ready means scope, milestones, outcomes, and
     requirements are specific enough to choose a Discovery milestone, and
     out-of-scope work is clear.
   - **Discovery:** Compare credible options for one milestone against the
     Project's requirements. Include a solution matrix when real alternatives
     exist. Stay implementation-agnostic: no APIs, schemas, or task
     sequences. Ready means trade-offs are recorded and the direction is
     chosen or narrowed.
   - **Design:** Blueprint the approved Discovery direction: components,
     interactions, and measures of success. Technologies are allowed; slices,
     interface contracts, and tasks are not. Ready means reviewers can
     authorize implementation without reopening rejected options.

   When revising, preserve approved content and record requested changes
   rather than rewriting history. If the work reveals a code, tooling, or
   `docs/specs/` change, stop: it needs its own engineering project. Finish
   grilling before marking the document `Awaiting approval`.
4. **Update the README.** Follow
   [PROJECTS-README.md](../shared/PROJECTS-README.md) for the artifact rows,
   PDD approval table, and next action. Confirm the README matches the
   documents.
