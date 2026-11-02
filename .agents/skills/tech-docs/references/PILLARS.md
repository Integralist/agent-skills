# Technical Documentation Pillars

Read these standards before auditing an existing document or drafting a new
one. Apply them together; each document should remain short and useful to its
intended reader.

## 1. Brevity

Omit needless words, following
[CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md). Judge sections as well as
sentences: remove prose already expressed by a table or diagram, and history
no current reader needs (it belongs in git or a linked ADR). Keep a neutral,
expert voice without frustration, hype, or asides. Use emoji only as status
cells in a table (`✅` or `❌`); GitHub callouts render their own icons.

## 2. Why and what, not how

Document intent, domain models, constraints, trade-offs, and boundaries.
Leave implementation mechanics to code and tests, the reliable record of how.
Explain a flow or lifecycle with a diagram or contract rather than a code
walkthrough.

## 3. Visualise simply

Use a Mermaid diagram of 15 nodes or fewer for architecture, workflows, and
lifecycles, following [conventions-mermaid](../../conventions-mermaid/SKILL.md).
Delete prose the diagram replaces. Use a table for many dimensions across
many cases, such as environment matrices or permission grids. Use indented
text for a chain or hierarchy too simple to diagram.

## 4. Decouple from volatile code

Leave out file paths, line numbers, private functions and classes, internal
variable names, and pasted source; they rot on the next refactor. Use stable
domain terms and public boundaries. When an example is essential, give a
generic schema or contract.

## 5. One document, one purpose

Flag a section long enough to stand alone for extraction and add
cross-references between related documents. Define terms an outsider would
not know, without explaining standard industry concepts at length.
