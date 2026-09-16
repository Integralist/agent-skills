---
name: pdd
description: >-
  Run a Product-Engineering initiative through Project, Discovery, and Design
  approval stages. Use when Product and Engineering need shared scope,
  milestone planning, solution evaluation, and an approved system design before
  engineering specification and implementation planning.
disable-model-invocation: true
argument-hint: "[project path or milestone]"
---

# Project, Discovery, Design

Run a cross-functional initiative through three approval gates:

1. **Project** — agree what the initiative is, why it matters, and when its
   milestones should land.
2. **Discovery** — evaluate solution directions for one milestone without
   committing to implementation details.
3. **Design** — document the approved system-level solution for that milestone
   well enough for Product, Engineering, and technical reviewers to sign off.

This is a Product-Engineering workflow. It is not an implementation plan and
it does not replace [`to-plan`](../to-plan/SKILL.md).

## Invocation and scope

This skill is user-invoked. Run one approval stage per invocation.

1. Locate the project directory from the argument. If no path is given, find
   active directories under `projects/` and ask the user to choose when more
   than one is plausible. If none exists, ask for the initiative name and
   create a dated project directory for the Project stage.
2. Read the project `README.md`, all existing PDD artifacts, and any linked
   research, specs, ADRs, or living specifications.
3. Identify the first stage whose artifact is not `Approved`. If its status is
   `Awaiting approval`, stop and ask for explicit approval; do not revise the
   document or start the next stage without a user decision.
4. Work only on that stage and its current milestone. Do not silently advance
   to the next stage in the same invocation.
5. Stop at the approval gate and report the exact status and next action.

If the request names a stage explicitly, verify that its prerequisites are
approved before working on it. Do not create Discovery before the Project stage
is approved. Do not create Design before the matching Discovery stage is
approved.

## Project workspace

Keep PDD documents in the project directory:

```text
projects/<yyyy-mm-dd>-<slug>/
├── README.md
├── project.md
├── discovery.md
├── design.md
├── spec.md
├── plan.md
└── tasks.md or tasks-slice-<n>.md
```

The project `README.md` is the index and approval tracker. Create it from
[`../shared/PROJECT-README.md`](../shared/PROJECT-README.md) when missing, then
keep its artifact links, statuses, and next action current.

The first milestone may use the unqualified names `discovery.md` and
`design.md`.
When a second milestone is introduced:

1. Rename the existing files to `discovery-m1.md` and `design-m1.md` when they
   exist.
2. Create `discovery-m2.md` and `design-m2.md`.
3. Update every link and status row in the project README in the same change.

If multiple milestones are known at project creation, use qualified names from
the start. Keep milestone identifiers stable even if their titles change.

## Canonical templates

Use the shared template for each PDD artifact:

- [Project](../shared/PDD-PROJECT-TEMPLATE.md)
- [Discovery](../shared/PDD-DISCOVERY-TEMPLATE.md)
- [Design](../shared/PDD-DESIGN-TEMPLATE.md)

Copy the matching template, replace every placeholder, and preserve its
headings and section order. Replace path placeholders with the actual relative
file path: use `discovery.md` for an unqualified single milestone or
`discovery-mN.md` for a qualified milestone. Never leave a path placeholder or
assume `discovery.md` when the project uses qualified names. Add a section only
when the project needs material that cannot fit the canonical structure; do not
invent a different document shape for each project.

## Approval language

Use approval states, not task-completion language:

- **Not started** — no artifact exists.
- **Draft** — the artifact is being developed.
- **Awaiting approval** — the artifact is ready for Product/Engineering or
  technical review.
- **Approved** — the required reviewers explicitly accepted it.
- **Needs revision** — reviewers requested changes.
- **Superseded** — a later artifact replaces it.

Creating, formatting, or self-reviewing a document never makes it `Approved`.
Ask for approval when the artifact reaches the review gate. On a later
invocation, record `Approved` only after the user explicitly confirms it.

## Stage 1: Project document

Set the Project status to `Draft` while writing and `Awaiting approval` when
all required sections are present. Start from the
[Project template](../shared/PDD-PROJECT-TEMPLATE.md) and write or update
`project.md` with:

- Preliminary milestones and their intended outcomes
- Key objectives
- Current architecture at a high level
- Target architecture vision without choosing implementation technology
- Expected benefits
- Functional requirements
- Non-functional requirements
- Miscellaneous links and context

Keep this document jointly understandable by Product and Engineering. Describe
what the initiative must achieve and how it will be staged; leave competing
technical approaches for Discovery.

The stage is ready for approval when the initiative scope, milestones,
outcomes, and requirements are specific enough to select one milestone for
Discovery and reviewers can identify what is deliberately outside the scope.

## Stage 2: Discovery document

Discovery applies to one Project milestone. Set its status to `Draft` while
writing and `Awaiting approval` when the alternatives are ready for review.
Start from the [Discovery template](../shared/PDD-DISCOVERY-TEMPLATE.md) and
write or update the matching `discovery*.md` with:

- Glossary
- Customer abstraction: what the customer perceives and values
- Description of the current situation
- Problem and contributing causes
- High-level approach
- Business outcomes
- Objective evaluation of the solution options

Include a solution matrix when there are meaningful alternatives. Compare the
options against the requirements and constraints from `project.md`.

Keep Discovery implementation-agnostic. Do not prescribe concrete APIs, class
or function designs, database schemas, deployment manifests, or detailed task
sequences. Those belong in Design or the engineering plan.

The stage is ready for approval when the team has evaluated credible options,
recorded the trade-offs, and selected or narrowed the direction for the
milestone. Technical leaders or architects should review it before Design.

## Stage 3: Design document

Design applies to the solution direction approved in the matching Discovery
artifact. Set its status to `Draft` while writing and `Awaiting approval` when
it is ready for sign-off. Start from the
[Design template](../shared/PDD-DESIGN-TEMPLATE.md) and write or update the
matching `design*.md` with:

- Goals and requirements
- Out-of-scope items
- Success metrics
- Proposed system-level design
- Rationale linked to the approved Discovery matrix
- Interactions with existing systems
- Required resources, expertise, and dependencies
- Development and rollout stages
- Risks, constraints, and mitigations
- Open questions and owners
- Stakeholders and approval record
- References

Design may name the selected technologies and system boundaries. Keep it at
blueprint level: explain what components change, how they interact, and how
success will be measured. Do not turn it into vertical implementation slices,
interface contracts, test code, or an executor's task list.

The stage is ready for approval when reviewers can authorize implementation
without reopening the rejected alternatives or the system-level approach.

## Handoff to engineering

After Design is explicitly `Approved`, hand off to the engineering workflow:

```text
Product: pdd (project → discovery → design)
                         ↓
                    to-spec
                         ↓
                    to-plan
                         ↓
                  to-tasks → next-task / next-slice
```

Use [`to-spec`](../to-spec/SKILL.md) to translate the approved Design into
stable behavior, acceptance criteria, and testing seams. Then use
[`to-plan`](../to-plan/SKILL.md) for vertical implementation slices and
[`to-tasks`](../to-tasks/SKILL.md) for executable work.

Do not run [`architect`](../architect/SKILL.md) automatically after an approved
Design. `architect` is the alternative engineering-led workflow: use it when
there is no Product-Engineering PDD process or when substantial engineering
research and design stress-testing is still required.

## README maintenance

Before finishing any invocation:

1. Ensure `projects/README.md` exists, creating it from
   [`../shared/PROJECTS-README.md`](../shared/PROJECTS-README.md) when needed.
2. Ensure the project `README.md` exists, creating it from
   [`../shared/PROJECT-README.md`](../shared/PROJECT-README.md) when needed.
3. Add or update the artifact row for every file created or renamed.
4. Update the PDD approval table and the concrete next action.
5. Leave the current stage as `Awaiting approval` rather than claiming
   approval that the user has not given.

## Guidelines

- Keep Product and Engineering language concrete and shared.
- Cite source documents and decisions with relative links.
- Preserve approved content when revising a document; record requested changes
  instead of silently rewriting the decision history.
- Load [`conventions-markdown`](../conventions-markdown/SKILL.md) before writing
  Markdown and [`conventions-mermaid`](../conventions-mermaid/SKILL.md) before
  adding a diagram.
