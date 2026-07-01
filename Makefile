.PHONY: install install-agents install-claude install-pi install-gemini install-copilot rules

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
#
# settings.json holds the AWS Bedrock account ID, so it's committed as a
# template (settings.json.tmpl) with a 1Password secret reference in place of
# the ID. `op inject` interpolates it into the installed file. Skipped with a
# warning when the 1Password CLI isn't available.
install-claude: install-agents rules
	mkdir -p ~/.claude
	cp .claude/CLAUDE.md ~/.claude/CLAUDE.md
	cp -r .claude/rules/ ~/.claude/rules/
	cp -r .claude/agents/ ~/.claude/agents/
	cp -r .claude/scripts/ ~/.claude/scripts/
	rm -rf ~/.claude/skills
	ln -s ~/.agents/skills ~/.claude/skills
	@if command -v op >/dev/null; then \
		op inject -i .claude/settings.json.tmpl -o ~/.claude/settings.json -f; \
		echo "Installed Claude settings.json."; \
	else \
		echo "Skipping settings.json: 1Password CLI (op) not found."; \
	fi

# Gemini (Antigravity CLI) reads ~/.gemini/antigravity-cli. Only copy the
# statusline when that directory already exists, so the target is a no-op on
# machines where the Gemini CLI isn't installed.
#
# settings.json holds the Google VertexAI project ID, so it's committed as a
# template (settings.json.tmpl) with a 1Password secret reference in place of
# the ID. `op inject` interpolates it into the installed file. Skipped with a
# warning when the 1Password CLI isn't available.
install-gemini:
	@if [ -d ~/.gemini ]; then \
		cp .gemini/settings.json ~/.gemini/settings.json; \
		echo "Installed Gemini settings.json."; \
	else \
		echo "Skipping Gemini settings.json: ~/.gemini does not exist."; \
	fi
	@if [ -d ~/.gemini/antigravity-cli ]; then \
		cp .gemini/antigravity-cli/statusline.sh ~/.gemini/antigravity-cli/statusline.sh; \
		echo "Installed Gemini statusline."; \
		if command -v op >/dev/null; then \
			op inject -i .gemini/antigravity-cli/settings.json.tmpl -o ~/.gemini/antigravity-cli/settings.json -f; \
			echo "Installed Gemini antigravity-cli settings.json."; \
		else \
			echo "Skipping antigravity-cli settings.json: 1Password CLI (op) not found."; \
		fi; \
	else \
		echo "Skipping Gemini statusline: ~/.gemini/antigravity-cli does not exist."; \
	fi

# Copilot CLI reads ~/.copilot. Only copy the statusline and settings.json when
# ~/.copilot/scripts already exists, so the target is a no-op when Copilot isn't
# installed. settings.json holds no secrets, so it's committed verbatim.
install-copilot:
	@if [ -d ~/.copilot/scripts ]; then \
		cp .copilot/scripts/statusline.sh ~/.copilot/scripts/statusline.sh; \
		cp .copilot/settings.json ~/.copilot/settings.json; \
		echo "Installed Copilot statusline and settings.json."; \
	else \
		echo "Skipping Copilot statusline: ~/.copilot/scripts does not exist."; \
	fi

install: install-claude install-pi install-gemini install-copilot
