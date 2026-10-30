# Review Convention Selection

Prepare a self-contained prompt for the read-only conventions reviewer. Select
rules by file type and purpose, not extension alone, so workflow conventions
apply even when a file has no language-specific suffix.

**Select.** Inspect available conventions-* skills and their scope. Start with:

- Go: [conventions-go](../conventions-go/SKILL.md).
- Python: [conventions-python](../conventions-python/SKILL.md).
- SQL: [conventions-sql](../conventions-sql/SKILL.md).
- Markdown: [conventions-markdown](../conventions-markdown/SKILL.md), plus
  [conventions-mermaid](../conventions-mermaid/SKILL.md) for Mermaid files or
  diagram blocks.
- Acceptance suites, steps, runners, and Makefile and shell acceptance
  workflows: load
  [conventions-acceptance-tests](../conventions-acceptance-tests/SKILL.md)
  alongside any language conventions.

Include other available conventions-* skills only when their scope applies;
this list is a starting point, not an allowlist. Inspect file contents and
purpose before deciding. If there are no applicable conventions, record that
and its reason instead of starting an empty conventions pass. Missing expected
guidance is a gap, not evidence that no rules apply.

**Load.** Put a map of selected skills, their resolved absolute paths, and the
changed files or purposes they cover in `CONTEXT_PATH`. Include repository
instructions from the reviewed revision. Give the conventions reviewer this
map and require it to read each selected skill and its applicable linked
references before auditing. Do not assume the subagent inherits loaded skills
or that naming a skill loads it. Give other reviewers the subset their work
requires; they still follow applicable language rules.

**Audit.** Check explicit requirements against changed code or code bound by a
contract the diff changes. Apply repository rules before generic guidance and
honour documented exceptions; report unresolved conflicts as unknowns. Keep
the rule's original strength: a recommendation is not a mandatory rule. Cite
the code and the written requirement for every convention finding. A rule
citation includes its source path, line range, and requirement; explicit rules
do not need peer examples. Personal preferences are not findings. Hand
unwritten consistency questions to maintainability.

**Coverage.** Return the skills and relevant references actually read in
`conventions_loaded`, with their file or purpose scope. Return missing or
unreadable guidance as an unknown and coverage gap, identifying what could
not be audited. The parent compares loaded guidance and reviewed files with
the selection map, closing omissions through the normal completion/retry
process. Report unresolved gaps rather than claiming a clean conventions pass.
