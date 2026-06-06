.PHONY: install install-agents install-claude install-pi rules

install-agents:
	mkdir -p ~/.agents
	cp -r .agents/ ~/.agents/

# Pi reads ~/.pi/agent/AGENTS.md. Install the canonical AGENTS.md there too.
install-pi:
	mkdir -p ~/.pi/agent
	cp .agents/AGENTS.md ~/.pi/agent/AGENTS.md

# Regenerate .claude/rules/{go,markdown}.md from their canonical skills. The
# skill SKILL.md bodies are the single source of truth; rules differ only by
# frontmatter (paths: globs). Run this after editing a *-conventions skill and
# before committing, since the rules are committed.
rules:
	bash .claude/scripts/gen-rules.sh

# Claude reads ~/.claude. Skills are NOT copied — they live in ~/.agents/skills
# and ~/.claude/skills is a symlink to them (single source of truth). Only the
# Claude-only assets (CLAUDE.md pointer, rules, agents, scripts) are copied.
# Rules are regenerated first so the installed copies match the skills.
install-claude: install-agents rules
	mkdir -p ~/.claude
	cp .claude/CLAUDE.md ~/.claude/CLAUDE.md
	cp -r .claude/rules/ ~/.claude/rules/
	cp -r .claude/agents/ ~/.claude/agents/
	cp -r .claude/scripts/ ~/.claude/scripts/
	rm -rf ~/.claude/skills
	ln -s ~/.agents/skills ~/.claude/skills

install: install-claude install-pi
