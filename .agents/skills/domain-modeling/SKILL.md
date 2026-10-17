---
name: domain-modeling
description: >-
  Build and sharpen a project's domain model. Use when creating or editing a
  `GLOSSARY.md`, updating a legacy `CONTEXT.md`, or writing an ADR, even when
  the request is simply to write or update the file; when the user wants to
  pin down domain terminology or a ubiquitous language, record an architectural
  decision; or when another skill needs to maintain the domain model.
metadata:
  model-tier: complex
---

# Domain Modeling

Build the domain model while you design: challenge terms, test them against
edge cases, and write the glossary and decisions down the moment they settle.
This skill is for changing the model; any skill can read `GLOSSARY.md` for
vocabulary without it.

**Files.** Keep one `GLOSSARY.md` at the repository root, grouping domain
areas under subheadings rather than splitting it into files, and ADRs in
`docs/adr/` with a repo-wide `docs/adr/README.md` index. If there's no
`GLOSSARY.md` but a root `CONTEXT.md` exists, use it in place rather than
create a duplicate, and on the first such use in a task, warn:

> ⚠️ This project uses legacy `CONTEXT.md`; rename it to `GLOSSARY.md`.
> I'll continue using the existing file for now.

If neither exists, create `GLOSSARY.md` when the first term is resolved, and
`docs/adr/README.md` with the first ADR.

**During the session:**

1. **Challenge** a term that conflicts with the glossary as soon as it comes
   up: "Your glossary defines 'cancellation' as X, but you seem to mean Y;
   which is it?"
2. **Sharpen** vague or overloaded terms into one precise word: "You're
   saying 'account'; do you mean the Customer or the User?"
3. **Test with scenarios** that probe edge cases and the boundaries between
   concepts.
4. **Check the code** when the user says how something works, and surface
   contradictions: "Your code cancels whole Orders, but you said partial
   cancellation is possible; which is right?"
5. **Update the glossary** the moment a term is resolved, not in a batch.
   Keep implementation detail out: it's a glossary, not a spec, scratch pad,
   or decision log.
6. **Offer an ADR** only when a decision passes the three tests in
   [ADR-FORMAT.md](../shared/ADR-FORMAT.md), and write it with that file's
   template, numbering, and registry rules.

## Glossary format

````md
# {Project Name} Glossary

{One or two sentences on the project and the glossary's scope.}

## Language

**Order**:
A request from a customer to purchase one or more items.
_Avoid_: Purchase, transaction

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
````

- **Be opinionated.** When several words name one concept, pick the best and
  list the rest under `_Avoid_`.
- **Keep definitions tight:** one or two sentences on what the term is, not
  what it does.
- **Include only project-specific domain terms,** not general programming
  concepts such as timeouts or error types, however often the project uses
  them.
- **Group related terms under subheadings** when clusters emerge, all in the
  one `GLOSSARY.md`.
