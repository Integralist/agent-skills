---
name: domain-modeling
description: >-
  Build and sharpen a project's domain model. Use when creating or editing a
  `GLOSSARY.md`, updating a legacy `CONTEXT.md`, or writing an ADR, even when
  the request is simply to write or update the file; when the user wants to
  pin down domain terminology or a ubiquitous language, record an architectural
  decision; or when another skill needs to maintain the domain model.
---

# Domain Modeling

The *active* discipline of building the domain model as you design:
challenging terms, inventing edge-case scenarios, and writing the
glossary and decisions down the moment they crystallise. (Merely
*reading* `GLOSSARY.md` (or a legacy `CONTEXT.md`) for vocabulary is a
one-line habit any skill can do — not this skill. This skill is for
changing the model, not consuming it.)

## File structure

Keep one root `GLOSSARY.md` for the project. Group terms for different
domain areas under subheadings instead of splitting the glossary across
files.

```txt
/
├── GLOSSARY.md
└── docs/
    └── adr/
        ├── README.md        # repo-wide ADR index
        ├── ADR-0001.md
        └── ADR-0002.md
```

Use the root `GLOSSARY.md` when it exists. If it does not exist but a root
`CONTEXT.md` does, use that file in place rather than creating a duplicate.
On the first fallback in a task, warn the user:

> ⚠️ This project uses legacy `CONTEXT.md`; rename it to `GLOSSARY.md`.
> I’ll continue using the existing file for now.

If neither file exists, create a root `GLOSSARY.md` lazily when the first
term is resolved. Create root `docs/adr/README.md` with the first ADR
anywhere in the repository.

## During the session

### Challenge against the glossary

When a term conflicts with the active glossary, call it out immediately.
"Your glossary defines 'cancellation' as X, but you seem to mean Y — which
is it?"

### Sharpen fuzzy language

When a term is vague or overloaded, propose a precise canonical one.
"You're saying 'account' — do you mean the Customer or the User? Those are
different things."

### Discuss concrete scenarios

Stress-test domain relationships with specific scenarios that probe edge
cases and force precision about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees.
Surface contradictions: "Your code cancels entire Orders, but you just
said partial cancellation is possible — which is right?"

### Update the glossary inline

When a term is resolved, update the active glossary right there — don't
batch. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md). Keep
the glossary devoid of implementation details: it is a glossary, not a
spec, scratch pad, or decision log.

### Offer ADRs sparingly

Only offer an ADR when all three hold:

1. **Hard to reverse** — changing your mind later costs meaningfully.
1. **Surprising without context** — a future reader will wonder "why this
   way?"
1. **The result of a real trade-off** — genuine alternatives existed and
   you picked one for specific reasons.

If any is missing, skip it. Follow the naming, migration, and content rules in
[ADR-FORMAT.md](./ADR-FORMAT.md).
