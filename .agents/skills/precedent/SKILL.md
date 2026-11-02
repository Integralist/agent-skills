---
name: precedent
description: >-
  Conform work to the precedent a project already sets: naming, API shape,
  error handling, test style, document structure, and terminology. Use when
  the user asks whether a change fits the codebase, or another skill needs to
  judge project conformance.
argument-hint: "[path | --uncommitted]"
metadata:
  model-tier: moderate
---

Match the work to patterns established by the surrounding project. Precedent
comes from peer files, not personal preference or a style guide; without a
cited sibling, a finding is an invention. Explicit conventions outrank
emergent precedent, so defer where a guide answers the question:
[conventions-go](../conventions-go/SKILL.md),
[conventions-markdown](../conventions-markdown/SKILL.md),
[conventions-mermaid](../conventions-mermaid/SKILL.md),
[conventions-python](../conventions-python/SKILL.md),
[conventions-sql](../conventions-sql/SKILL.md), and the project's
`GLOSSARY.md` for domain terms. If there is only a legacy `CONTEXT.md`, use
it and warn with `⚠️` that it should be renamed to `GLOSSARY.md`. This skill
owns the patterns a codebase grew that no guide records.

**Scope.** A path or glob audits those files. `--uncommitted`, or "what I'm
working on", means files listed by `git status --porcelain`. With no
argument, ask which path to check.

1. **Find peers for every file.** Look for files doing the same job: package
   siblings, other implementations of an interface, tests of the same shape,
   or documents at the same level. Two peers can establish a pattern; one
   may be coincidence, so widen the search after finding one. If a file has
   no peers, record that it has nothing to conform to and move on.
2. **Compare applicable patterns.** Compare every file with its peers.
   Consider:
   - **Code:** identifier, file, test, and package naming; API shape
     (signatures, return types, receivers, constructors, options); error
     wrapping, sentinels, and where errors surface; logger, levels, keys, and
     spans; file placement and package layout; test style, helpers, fixtures,
     assertions, case names; and existing libraries for the job.
   - **Documents:** section names, order, and heading depth; expected
     sections; frontmatter fields and value style; table, list, or prose for
     similar content; and the words, person, and mood used by the glossary
     and neighbouring documents.
3. **Report before changing anything.** Rank findings by blast radius:
   patterns other code will copy first, one-off cosmetics last. Each finding
   must state the divergence, the precedent, and cite at least two peers. If
   the target is better, say so and offer the inverse—changing the project to
   match—plus the cost in call sites moved. Conformance is the default; the
   goal is one pattern.
4. **Apply with the user, one finding at a time.** The user accepts, skips,
   or inverts each finding. Apply an accepted fix before moving to the next,
   so each edit stays steerable.

**Large paths.** Read-only peer-finding on a large path may be delegated to
subagents on the cheapest adequate tier. Follow
[SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), including its
completion and retry protocol. Report and apply in the main thread.
