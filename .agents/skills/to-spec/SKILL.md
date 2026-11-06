---
name: to-spec
description: >-
  Write a project spec: the problem, the solution, and Gherkin acceptance
  criteria, with any delta against the living spec. Use when specifying a
  feature, saving a spec discussed in chat, or when another skill needs a spec.
argument-hint: "[source path | github | #<issue>]"
allowed-tools: Bash(git config:*), Bash(date:*), Bash(gh issue:*), Bash(gh label:*), Glob, Grep, Read, Write
metadata:
  model-tier: complex
---

Turn a file or this session's discussion into `spec.md`: what to build, for
whom, and the Gherkin criteria that define done. A spec is the stable *what*:
interfaces, contracts, schema, and API shape, not implementation file paths or
code. Write the spec; don't plan or build it. Do not edit `docs/specs/` while
drafting `spec.md`. For later changes to living specs, use
[spec-delta](../spec-delta/SKILL.md).

**Stop and ask.** Follow the source as given. If something is missing,
contradictory, or points to a wrong design, tell the user and wait. Do not fill
gaps with guesses.

**Workflow.**

1. **Choose and preserve the source.** Use the named file, or this session if
   none is named. For `github` or an issue reference (`#<n>` or URL), read and
   follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues
   and Issue Artifacts instead of `projects/`. Capture the spec already worked
   out; do not start over.
   Preserve the build request and requirement-changing clarifications in
   `spec.md`'s `## Development Brief` (see
   [SPEC-GUIDE.md](references/SPEC-GUIDE.md)), using verbatim quotes or
   links to full documents at fixed revisions. Keep earlier wording;
   record later decisions separately. Redact secrets. Ask if the source is
   insufficient.
2. **Read current truth.** Read linked research, `docs/adr/` decisions, touched
   code, and `docs/specs/<capability>.feature`, if present. Treat legacy
   Markdown living specs as migration baselines, not the new output format. The
   living spec is current truth; without one, use code. Do not contradict
   current behaviour or decisions.
3. **Write acceptance criteria.** Before drafting scenarios or a Behavioural
   Delta section in `spec.md`, read [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) and
   [SPEC-GUIDE.md](references/SPEC-GUIDE.md) for scenario, living-spec, seam,
   and template rules. Give every requested behaviour a scenario and
   testing seam; assign every durable scenario to an owning living feature.
4. Before drafting, read [voice-product](../voice-product/SKILL.md). Write
   `spec.md` in the source's project folder or a new
   `projects/<yyyy-mm-dd>-<slug>/`, using the
   [SPEC-GUIDE.md](references/SPEC-GUIDE.md) template. Set Status `Draft`; fill
   Author and Created with `git config user.name` and `date +%F`. Use
   voice-product for all authored text, including criteria and Gherkin; keep
   quotations verbatim. Omit Behavioural
   Delta if behaviour does not change. Before indexing, read
   [PROJECTS-README.md](../shared/PROJECTS-README.md) and add the spec to the
   project README as described.

**Done when** the file is written and the user has its path.
