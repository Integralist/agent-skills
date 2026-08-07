---
name: precedent
description: >-
  Conform work to the precedent a project already sets — naming, API shape,
  error handling, test style, terminology. Use when the user asks whether a
  change fits the codebase, when another skill needs to judge project
  conformance, or on /precedent.
argument-hint: "[path | --uncommitted]"
---

# Precedent

Match work to what the project already does. The **precedent** is the pattern
the surrounding files establish — not a style guide, and not your priors. A
finding without a cited sibling is an invention.

## Boundary

An explicit convention outranks emergent precedent. Where one of these answers
the question, it is authoritative and this skill defers to it:

- Go — [`go-conventions`](../go-conventions/SKILL.md)
- Markdown — [`markdown-conventions`](../markdown-conventions/SKILL.md)
- Domain terms — the nearest `CONTEXT.md` glossary

This skill owns what no guide writes down: the patterns a codebase grew.

## Scope

Take the target from the first source that applies:

1. A path or file passed as the argument.
1. Uncommitted changes (`git status --porcelain`), on `--uncommitted` or when
   the user means "what I'm working on".
1. Neither — ask which path to check.

## Find the precedent

For each file in scope, locate its **peers** — the files doing the same kind of
job: siblings in the package, other implementations of the interface, other
tests of the same shape, other docs at the same level.

Two peers establish a pattern; one is a coincidence. When you find only one,
widen the search before reporting anything. When you find none, record the file
as having no precedent and move on — a first-of-its-kind file has nothing to
conform to.

## Compare

Check each file against its peers on every axis that applies:

- **Naming** — identifiers, files, test functions, packages.
- **API shape** — signatures, return types, receivers, constructor and option
  patterns.
- **Error handling** — wrapping, sentinel values, where errors surface.
- **Logging and observability** — logger, level, key names, what gets a span.
- **Structure** — where a kind of file lives, how a package is laid out, what
  goes in which file.
- **Test style** — table-driven or not, helper and fixture conventions,
  assertion style, how cases are named.
- **Dependencies** — whether the project already has a library for this.
- **Terminology and prose** — the words the glossary and neighbouring docs use,
  heading depth, voice.

Done when every file in scope has been compared against a located peer set, or
recorded as having none.

## Report

Emit the findings before changing anything. Each carries the divergence, the
precedent, and at least two citations:

```txt
1. internal/store/user.go:42 — constructor returns (*User, error);
   siblings return (User, error).
   Precedent: internal/store/order.go:31, internal/store/team.go:28
```

Rank by blast radius: patterns other code will copy first, one-off cosmetics
last.

## The outlier may be right

When the target is better than the precedent, say so and offer the inverse —
change the project to match the new code. Name the cost: how many call sites
move. Conformance is the default, not the goal; the goal is one pattern.

## Apply

Work the list with the user, one finding at a time: they take it, skip it, or
invert it. Apply each accepted fix before moving to the next, so every edit
stays steerable.

Read-only peer-finding across a large path may fan out — dispatch it to
subagents on the cheapest adequate model, then report and apply in the main
thread. See
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md).
