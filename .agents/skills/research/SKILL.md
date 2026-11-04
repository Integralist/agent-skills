---
name: research
description: >-
  Research a topic, pattern, or codebase in depth and save a sourced reference
  document. Use when investigating a topic, exploring an external repository,
  or doing architecture research.
metadata:
  model-tier: moderate
---

Produce a deep, cited reference document as a foundation for later planning or
implementation. If the request has no clear topic or repository, use the
clarify skill first.

**Choose the output path.** By default, write
`docs/research/<yyyy-mm-dd>-<slug>.md` using today's date. If the user or a
coordinating skill names an active `projects/<project>/` directory, write
`projects/<project>/research.md` instead. Ask if the scope is unclear; do not
create a project directory solely because research may help later.

For project scope, create `projects/README.md` from
[PROJECTS-README.md](../shared/PROJECTS-README.md) and
`projects/<project>/README.md` from
[PROJECT-README.md](../shared/PROJECT-README.md) if either is missing. Add
one `research.md` row to the project's artifact table and keep research
findings in `research.md` only.

**Choose the mode.** A GitHub URL, `org/repo`, or bare repo name means code
research. A topic, concept, or question means topic research.

**Sources.** In both modes, search organizational knowledge as well as code
and the web, following [KNOWLEDGE-SOURCES.md](../shared/KNOWLEDGE-SOURCES.md).
Treat Confluence and Google Drive as primary sources alongside code and docs;
Slack is supporting context, not authority.

1. **Check for existing research.** Check the project's `research.md` and
   `docs/research/`, matching by slug and ignoring any date prefix. For
   example, "CI pipeline caching" may match `*-ci.md` or
   `*-continuous-integration.md`, and `acme/widgets` may match
   `*-widgets.md`. If a match fully answers the question, summarise it and
   stop. If it covers the topic partly, extend it rather than starting a
   second file.
2. **Research.** Before investigating, read
   [RESEARCH-GUIDE.md](references/RESEARCH-GUIDE.md) and follow its code or
   topic workflow, template, and writing rules. Every question in scope must end
   with cited findings or be listed as unknown.
3. **Save and report.** Use the chosen path and template; extend the existing
   document if step 1 found one. Summarise the research for the user and give
   the full document path. For project scope, ensure the project README
   indexes it.
