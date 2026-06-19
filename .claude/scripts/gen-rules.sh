#!/usr/bin/env bash
#
# gen-rules.sh — generate Claude path-scoped rules from the canonical skills.
#
# The skill SKILL.md files in .agents/skills/ are the single source of truth for
# convention content. Claude Code consumes the same content as path-scoped rules
# under .claude/rules/, which need a different frontmatter (`paths:` globs)
# instead of the skill's `name:`/`description:`. This script regenerates each
# rule by stripping the skill frontmatter and prepending the rule frontmatter,
# so the body stays byte-identical to the skill.
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
	local skill="$1" rule="$2" glob="$3"
	{
		printf -- '---\n'
		printf -- 'paths:\n'
		printf -- "  - '%s'\n" "$glob"
		printf -- '---\n'
		strip_frontmatter "$skill"
	} >"$rule"
	echo "generated $rule from $skill"
}

gen .agents/skills/go-conventions/SKILL.md       .claude/rules/go.md       '**/*.go'
gen .agents/skills/markdown-conventions/SKILL.md .claude/rules/markdown.md '**/*.md'

# copy_siblings <skill-dir> <rule-dir> — copy non-SKILL.md
# files so relative links in the generated rule resolve.
copy_siblings() {
	local skill_dir="$1" rule_dir="$2"
	find "$skill_dir" -maxdepth 1 -name '*.md' ! -name 'SKILL.md' -exec cp {} "$rule_dir/" \;
}

copy_siblings .agents/skills/go-conventions       .claude/rules
copy_siblings .agents/skills/markdown-conventions  .claude/rules
