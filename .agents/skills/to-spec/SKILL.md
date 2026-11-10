---
name: to-spec
description: >-
  Write a project spec: the problem, the solution, and Gherkin acceptance
  criteria, with any delta against the living spec. Use when specifying a
  feature, saving a spec discussed in chat, or when another skill needs a spec.
argument-hint: "[source path | github | #<issue>]"
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Grep, Read, Write
metadata:
  model-tier: complex
---

Write `spec.md` from a file or discussion: what to build, for whom and the
Gherkin criteria defining done. Capture interfaces, contracts, schemas and API
shape, not implementation paths or code. Write the spec; do not plan, build
or edit `docs/specs/`. Later living-spec changes use
[spec-delta](../spec-delta/SKILL.md).

**Stop and ask.** Follow the source as given. If something is missing,
contradictory, or points to a wrong design, tell the user and wait. Do not fill
gaps with guesses.

**Workflow.**

1. **Choose the source and destination.** Use the named file, or this session
   if none is named. For `github` or an issue reference (`#<n>` or URL), read
   and follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) instead of `projects/`.
   Keep the agreed spec. Preserve the request and requirement-changing
   clarifications in Development Brief as the
   [guide](references/SPEC-GUIDE.md) describes. Keep original evidence,
   record later decisions separately, and redact secrets.
2. **Read current truth.** Read linked research, `docs/adr/`, touched code
   and owning `docs/specs/<capability>.feature` files. Living specs are the
   baseline; without one, use code. Treat legacy Markdown contracts as
   migration baselines, not the output format. Preserve governing decisions.
3. **Draft for the reader.** Before any prose or Gherkin, read
   [voice-product](../voice-product/SKILL.md),
   [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) and the
   [writing guide and clarity check](references/SPEC-GUIDE.md). Use product
   voice throughout the full specification. Default to plain, reader-facing
   explanations that are clear to product and engineering readers. Explain
   necessary jargon. Keep technical terms or exact values when they define a
   required contract, security guarantee, testable outcome, or open decision;
   explain what they mean and why they matter while preserving ownership,
   permissions, timing, failures, and uncertainty. Name each component and
   explain its role at first use. If a proposal expands an existing component,
   distinguish its current responsibility from the proposed change. Use tables
   when they make comparable facts easier to scan; keep narrative in prose and
   use numbered lists for ordered steps and user stories. Give each requested
   behaviour a scenario and testing seam; assign durable scenarios to owning
   living features. Omit Behavioural Delta when behaviour does not change.
4. **Write and check.** Use the guide's metadata table. Set Status `Draft`,
   Author from `git config user.name`, and Created from `date +%F`. Language
   names the primary implementation language; put fixture/runtime languages
   elsewhere. Add optional metadata only when it helps readers orient to the
   project, baseline or decision status. Use repository-unique short SHAs in
   baseline metadata and full SHAs in pinned source links, following
   [Markdown conventions](../conventions-markdown/SKILL.md). Run the guide's
   whole-draft clarity check before handoff. For a scoped revision, review
   changed sections and related terms/references without expanding the edit or
   restarting architecture critique.

   - **On disk:** Write in the source project folder or
     `projects/<yyyy-mm-dd>-<slug>/spec.md`. Read
     [PROJECTS-README.md](../shared/PROJECTS-README.md) before indexing it.
   - **GitHub:** Follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md)
     to publish `spec.md` as a Root Issue Artifact and update its index.

**Done when** the requested spec is written, the clarity and contract checks
are complete, and the user has its path and any unresolved questions or
verification gaps. Document checks do not prove passing acceptance tests.
