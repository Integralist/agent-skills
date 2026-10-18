---
name: precedent
description: >-
  Conform work to the precedent a project already sets: naming, API shape,
  error handling, test style, document structure, and terminology. Use when
  the user asks whether a change fits the codebase, or another skill needs to
  judge project conformance.
argument-hint: "[path | --uncommitted]"
metadata:
  model-tier: complex
---

# Precedent

Match work to what the project already does. The precedent is the pattern
the surrounding files establish, not a style guide and not your priors, so a
finding without a cited sibling is an invention. An explicit convention
outranks emergent precedent, so defer wherever one answers the question:
[conventions-go](../conventions-go/SKILL.md),
[conventions-markdown](../conventions-markdown/SKILL.md),
[conventions-mermaid](../conventions-mermaid/SKILL.md),
[conventions-python](../conventions-python/SKILL.md),
[conventions-sql](../conventions-sql/SKILL.md), and the project's
`GLOSSARY.md` for domain terms. If only a legacy `CONTEXT.md` exists, use it
and warn with `⚠️` to rename it to `GLOSSARY.md`. This skill owns what no
guide writes down: the patterns a codebase grew.

**Scope.** A file path or glob audits those files. `--uncommitted`, or "what
I'm working on", audits the files from `git status --porcelain`. With no
argument, ask which path to check.

1. **Find the peers** of each file in scope: the files doing the same job,
   such as package siblings, other implementations of the interface, tests
   of the same shape, or docs at the same level. Two peers set a pattern and
   one is a coincidence, so widen the search when you find one. A file with
   none has nothing to conform to; record it and move on. Done when every
   file has a peer set or is recorded as having none.
2. **Compare** each file with its peers on every axis that applies. Done
   when every file in scope is compared.
   - **Code:** naming of identifiers, files, tests, and packages; API shape
     (signatures, return types, receivers, constructors and options); error
     wrapping, sentinels, and where errors surface; logger, levels, key
     names, and what gets a span; where a kind of file lives and how a
     package is laid out; test style (table-driven or not, helpers,
     fixtures, assertions, case names); and whether the project already has
     a library for this.
   - **Documents:** section names, order, and heading depth, and which
     sections a document of this kind carries; frontmatter fields and value
     style; table, list, or prose for the same kind of content; and the
     words, person, and mood the glossary and neighbouring docs use.
3. **Report** the findings before changing anything, ranked by blast
   radius: patterns other code will copy first, one-off cosmetics last.
   Each gives the divergence, the precedent, and at least two citations.
   When the target is better than the precedent, say so and offer the
   inverse, changing the project to match, with the cost in call sites
   moved; conformance is the default, but the goal is one pattern. Done
   when every finding is listed in this shape:

   ```txt
   1. internal/store/user.go:42 — constructor returns (*User, error);
      siblings return (User, error).
      Precedent: internal/store/order.go:31, internal/store/team.go:28
   ```

4. **Apply** with the user one finding at a time: they take it, skip it, or
   invert it, and you apply each accepted fix before the next so every edit
   stays steerable. Done when every finding is settled.

**Large paths.** Read-only peer-finding across a large path can fan out to
subagents on the cheapest adequate model, following
[SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md) and its
completion and retry protocol; report and apply in the main thread.
