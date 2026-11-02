---
name: improve-codebase-architecture
description: >-
  Scan a codebase for deepening opportunities, present them as a visual HTML
  report, then grill through the one the user picks. Use when asked to improve
  a codebase's architecture, find shallow modules, or make code more testable
  and easier for agents to navigate.
disable-model-invocation: true
metadata:
  model-tier: complex
---

**Architecture vocabulary.** Use the module-design principles and vocabulary
in [code-module-design](../code-module-design/SKILL.md): module, interface,
depth, seam, adapter, leverage, locality, the deletion test, and the interface
as the test surface. One adapter suggests a hypothetical seam; two make it
real.

**Domain language.** Use the root `GLOSSARY.md` and call a module by its
domain name, such as "the Order intake module," not an implementation name
such as "the FooBarHandler" or "the Order service." If there is no
`GLOSSARY.md` but a `CONTEXT.md` exists, use it instead and warn the user with
`⚠️` to rename it rather than creating a duplicate. Treat ADRs in `docs/adr/`
as decisions not to relitigate.

## Workflow

1. **Scope before you scan.** Deepening pays off by easing future changes, so
   weight the parts of the codebase that change most. Take the user's
   direction if they gave one (a module, subsystem, or pain point).
   Otherwise walk back a good stretch of `git log --oneline` for the files
   and areas that keep coming up, widening the net if changes are scattered.
   Read the glossary and any ADRs for that area. Done when you know where to
   look.
2. **Explore** with a subagent, following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), including
   its completion and retry protocol. Have it walk the code and note
   friction: understanding one concept means bouncing between many small
   modules; an interface nearly as complex as its implementation; pure
   functions extracted for testability while the bugs hide in how they're
   called; tightly coupled modules leaking across their seams; code that's
   untested or hard to test through its interface. Apply the deletion test to
   anything that looks shallow: deleting it should concentrate complexity,
   not just move it. Done when you have a list of candidates.
3. **Write the HTML report** to `<tmpdir>/architecture-review-<timestamp>.html`
   (`$TMPDIR`, falling back to `/tmp`, or `%TEMP%` on Windows), so nothing
   lands in the repo and each run gets a fresh file, following
   [HTML-REPORT.md](references/HTML-REPORT.md). Give each candidate a card
   with its files, the problem, the solution in plain English, benefits in
   terms of locality, leverage, and tests, a before/after diagram, and a
   strength
   badge (`Strong`, `Worth exploring`, or `Speculative`), and end with the
   top recommendation and why. Surface a candidate that contradicts an ADR
   only when the friction justifies reopening it, and mark it ("contradicts
   ADR-0007, but worth reopening because…"). Propose no interfaces yet. Open
   the file (`open` on macOS, `xdg-open` on Linux, `start` on Windows), give
   its absolute path, and ask "Which of these would you like to explore?"
   Done when the user picks one.
4. **Grill the chosen candidate** with the grilling skill: constraints,
   dependencies, the shape of the deepened module, what sits behind the
   seam, and which tests survive. Keep the domain model current as decisions
   settle, using [domain-modeling](../domain-modeling/SKILL.md):
   - Add a new concept's name to the glossary when you name a deepened
     module after it, creating `GLOSSARY.md` if neither file exists, and
     update a term the moment it's sharpened.
   - When the user rejects the candidate for a reason a future review would
     need to know, offer: "Want me to record this as an ADR so future
     architecture reviews don't re-suggest it?" Skip ephemeral reasons ("not
     worth it right now") and self-evident ones.
   - To explore alternative interfaces, follow
     [DESIGN-IT-TWICE.md](../code-module-design/references/DESIGN-IT-TWICE.md).

   Done when the user has settled the candidate's design or rejected it.
