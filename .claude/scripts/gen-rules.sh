#!/usr/bin/env bash
#
# gen-rules.sh — generate Claude path-scoped rules from the canonical skills.
#
# The skill SKILL.md files in .agents/skills/ are the single source of truth for
# convention content. Claude Code consumes the same content as path-scoped rules
# under .claude/rules/, which need a different frontmatter (`paths:` globs)
# instead of the skill's `name:`/`description:`. This script regenerates each
# rule by stripping the skill frontmatter and prepending the rule frontmatter,
# so the body matches the skill apart from relative links.
#
# Skill links like `](../shared/X.md)` resolve from .agents/skills/<skill>/, but
# a rule lives in .claude/rules/ (or ~/.claude/rules/), where `../shared/` does
# not exist. Both .claude/ and ~/.claude/ carry a `skills` symlink to the skills
# tree. Parent links resolve through ../skills/; local references/ links resolve
# through ../skills/<skill>/references/. Referenced files stay canonical, with
# no generated copies to keep in sync.
#
# Run via `make rules`. `make install` runs it automatically.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

# strip_frontmatter <file> — print the body after the leading YAML frontmatter
# block (the content following the second `---` line, including the blank line).
strip_frontmatter() {
	awk 'f { print } /^---$/ { c++; if (c == 2) f = 1 }' "$1"
}

# gen <skill-path> <rule-path> <paths-glob>
gen() {
	local skill="$1" rule="$2" glob="$3" skill_name
	skill_name="$(basename "$(dirname "$skill")")"
	{
		printf -- '---\n'
		printf -- 'paths:\n'
		printf -- "  - '%s'\n" "$glob"
		printf -- '---\n'
		strip_frontmatter "$skill" | sed -E \
			-e 's#]\(\.\./#](../skills/#g' \
			-e "s#]\\((\\./)?references/#](../skills/$skill_name/references/#g"
	} >"$rule"
	echo "generated $rule from $skill"
}

gen .agents/skills/conventions-go/SKILL.md       .claude/rules/go.md       '**/*.go'
gen .agents/skills/conventions-markdown/SKILL.md .claude/rules/markdown.md '**/*.md'
gen .agents/skills/conventions-mermaid/SKILL.md  .claude/rules/mermaid.md  '**/*.{mmd,mermaid}'
gen .agents/skills/conventions-python/SKILL.md   .claude/rules/python.md   '**/*.py'
gen .agents/skills/conventions-sql/SKILL.md      .claude/rules/sql.md      '**/*.sql'
gen .agents/skills/spec-delta/SKILL.md           .claude/rules/spec-delta.md 'docs/specs/**'

# Remove the old Go reference copies only when their provenance identifies
# them as generated. Preserve any user-owned files with the same names.
for legacy in .claude/rules/{LINTER-DIRECTIVES,STDLIB-PREFERENCES}.md; do
	if [[ -f "$legacy" ]] &&
		grep -q '^<!-- generated from .agents/skills/conventions-go/' "$legacy"; then
		rm -- "$legacy"
	fi
done
