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

Build the domain model while designing: challenge terms, test them against
edge cases, and record settled vocabulary and decisions as they happen. This
skill changes the model; any skill may read `GLOSSARY.md` for vocabulary
without invoking it.

## Files

- Keep one root `GLOSSARY.md`, with domain areas grouped under subheadings
  rather than split across files.
- Keep ADRs in `docs/adr/` and maintain a repo-wide `docs/adr/README.md` index.
- If there is no `GLOSSARY.md` but a root `CONTEXT.md` exists, use that file
  rather than creating a duplicate. On the first use in a task, warn:

  > ⚠️ This project uses legacy `CONTEXT.md`; rename it to `GLOSSARY.md`.
  > I'll continue using the existing file for now.

- If neither file exists, create `GLOSSARY.md` when the first term is
  resolved, and create `docs/adr/README.md` with the first ADR.

## During the session

1. **Challenge conflicts promptly.** If a term conflicts with the glossary,
   ask which meaning is intended: "Your glossary defines 'cancellation' as X,
   but you seem to mean Y; which is it?"
2. **Sharpen vague terms.** Choose one precise word for an overloaded concept:
   "You're saying 'account'; do you mean the Customer or the User?"
3. **Test boundaries.** Use scenarios to probe edge cases and distinctions
   between concepts.
4. **Check claims against code.** If the user describes system behaviour,
   inspect the code and surface contradictions: "Your code cancels whole
   Orders, but you said partial cancellation is possible; which is right?"
5. **Update as soon as a term settles.** Keep implementation detail out of
   the glossary; it is not a spec, scratch pad, or decision log.
6. **Offer ADRs selectively.** Write one only when a decision passes all three
   tests in [ADR-FORMAT.md](../shared/ADR-FORMAT.md), using that file's
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

- Be opinionated: choose the best term and list alternatives under `_Avoid_`.
- Keep definitions to one or two sentences describing what the term is, not
  what it does.
- Include project-specific domain terms only. Do not define general
  programming concepts such as timeouts or error types.
- Group related terms under subheadings in the single `GLOSSARY.md` as
  clusters emerge.
