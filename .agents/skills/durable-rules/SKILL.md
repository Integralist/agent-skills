---
name: durable-rules
description: >-
  Surface systemic patterns from an investigation as codified
  conventions or anti-patterns.
disable-model-invocation: true
---

# Surface Durable Rules

After producing a plan, review the investigation findings for
**systemic patterns** that should be codified as ongoing
conventions or anti-patterns — guidance that applies beyond the
specific task. Scope is coding conventions and anti-patterns only;
project operating instructions (build/test/lint commands, gotchas)
belong to [`agents-md`](../agents-md/SKILL.md).

1. If the investigation surfaced no durable lessons, skip
   entirely. Do not force it.
2. For each candidate rule, classify its **scope**:
   - **Project-specific** (a rule true only of this repo) → target
     the repo's own conventions dir or convention skills if it has
     one; otherwise its `.agents/AGENTS.md` via `agents-md`.
   - **Cross-project** (a universal rule) → target the global
     convention source.
3. Within the chosen target, update an existing file that covers
   the topic, or propose a new conventions file if none does.
4. **Never edit a generated file.** If the target carries a
   "generated" banner or a generator produces it, edit the source
   and regenerate — the artifact is not the source of truth.
5. **Present the proposed rule(s) to the user for confirmation
   before writing.**
6. Only write after the user confirms.
