---
name: critique
description: >-
  Critique a document for logical fallacies, reasoning flaws, unsupported
  claims, and structural weaknesses, with a concrete fix for each issue. Use
  when reviewing a plan, spec, proposal, or other document before acting on it.
disable-model-invocation: true
metadata:
  model-tier: complex
---

Critique a document for reasoning flaws, factual/consistency gaps, and
structural weaknesses. Quote each real issue and propose a concrete fix; drop
style preferences and never invent problems. If the document is sound, say so.

## Workflow

1. **Read the document and its sources.** Use the given path (ask if none).
   For project documents, also read root `GLOSSARY.md` (or legacy `CONTEXT.md`)
   and the records the document cites or summarises (ADRs, specs, design docs).
2. **Check the substance:**
   - **Reasoning & assumptions:** Logical fallacies, hidden or unjustified
     assumptions, conclusions that outrun evidence, or missing counterarguments.
   - **Consistency with cited records:** Internal contradictions, absolute
     claims whose cited source has exceptions, status claims beyond the source
     of truth, restated lists that diverge from their source, or "not
     applicable" claims the repo already answers.
   - **Newcomer clarity & terminology:** Undefined terms, unexplained lettered
     IDs/shorthand before first use, vague obligations, or glossary conflicts
     that create ambiguity (ignore harmless style variation).
   - **Bloat & buried decisions:** Repeated sections across slices/artifacts,
     copied repo-rule boilerplate, walls of prose, or key decisions buried
     under uncollapsed technical detail.
3. **Apply artifact checklists when relevant** (skip for blog posts, research,
   PDD drafts, and design notes):
   - **Plans / task lists** (`plan.md`, `tasks*.md`, or slice/milestone docs):
     read and follow [PLAN-CHECKLIST.md](references/PLAN-CHECKLIST.md).
   - **Specs / Gherkin** (`spec.md`, `*.feature`, or `docs/specs/` work): read
     and follow [SPEC-CHECKLIST.md](references/SPEC-CHECKLIST.md).
4. **Report findings ordered by impact.** Critique rather than rewriting the
   document. For each issue, include a quote, why it matters, and a concrete
   fix:

   ```txt
   **{Category or flaw — brief title}**

   > {Quoted passage}

   Problem: {Why it breaks reasoning, accuracy, or clarity.}

   Fix: {Specific rewrite or concrete next step.}
   ```

   End with a short summary naming the most significant weaknesses and the
   single highest-impact fix.
