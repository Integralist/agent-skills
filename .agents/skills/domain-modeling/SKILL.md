---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
---

# Domain Modeling

The *active* discipline of building the domain model as you design:
challenging terms, inventing edge-case scenarios, and writing the
glossary and decisions down the moment they crystallise. (Merely
*reading* `CONTEXT.md` for vocabulary is a one-line habit any skill can
do — not this skill. This skill is for changing the model, not consuming
it.)

## File structure

Most repos have a single context:

```txt
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

A `CONTEXT-MAP.md` at the root means multiple contexts; the map points to
where each lives:

```txt
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily: a `CONTEXT.md` when the first term is resolved, a
`docs/adr/` when the first ADR is needed.

## During the session

### Challenge against the glossary

When a term conflicts with the existing language in `CONTEXT.md`, call it
out immediately. "Your glossary defines 'cancellation' as X, but you seem
to mean Y — which is it?"

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

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there — don't batch.
Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md). Keep
`CONTEXT.md` devoid of implementation details: it is a glossary, not a
spec, scratch pad, or decision log.

### Offer ADRs sparingly

Only offer an ADR when all three hold:

1. **Hard to reverse** — changing your mind later costs meaningfully.
1. **Surprising without context** — a future reader will wonder "why this
   way?"
1. **The result of a real trade-off** — genuine alternatives existed and
   you picked one for specific reasons.

If any is missing, skip it. Use the format in
[ADR-FORMAT.md](./ADR-FORMAT.md).
