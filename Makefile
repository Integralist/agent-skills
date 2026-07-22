.PHONY: install install-agents install-claude install-pi install-gemini install-copilot install-opencode install-google-workspace-mcp rules

install-agents:
	mkdir -p ~/.agents
	cp -r .agents/ ~/.agents/

# Install Pi, its configured packages, and global settings. The repository
# settings are copied last so they remain the source of truth after pi install
# updates the global package store. mcp.json is templated because it contains
# the Context7 API key; op inject bakes it in, skipped when op is absent.
install-pi:
	npm install -g --ignore-scripts @earendil-works/pi-coding-agent
	@for package in npm:@odinlayer/pi-statusbar npm:pi-effort npm:@shuv1337/pi-mcp-adapter; do \
		pi install "$$package" --no-approve; \
	done
	mkdir -p ~/.pi/agent/themes
	cp .agents/AGENTS.md ~/.pi/agent/AGENTS.md
	cp .pi/agent/settings.json ~/.pi/agent/settings.json
	cp .pi/agent/themes/nord-contrast.json ~/.pi/agent/themes/nord-contrast.json
	@if command -v op >/dev/null; then \
		op inject -i .pi/agent/mcp.json.tmpl -o ~/.pi/agent/mcp.json -f; \
		echo "Installed Pi mcp.json."; \
	else \
		echo "Skipping mcp.json: 1Password CLI (op) not found."; \
	fi

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
#
# ~/.claude.json holds many settings we don't manage, so we never overwrite it
# wholesale. install codifies only mcpServers in .claude.json.tmpl (Context7 key
# as an op ref). If ~/.claude.json is absent, the injected template is copied
# verbatim; if present, jq deep-merges our mcpServers over the existing object
# (our servers win, manually-added servers survive, nothing else is touched).
# Requires jq for the merge path; skipped with a warning when jq is absent.
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
		if [ ! -f ~/.claude.json ]; then \
			op inject -i .claude.json.tmpl -o ~/.claude.json -f; \
			echo "Created ~/.claude.json from template."; \
		elif command -v jq >/dev/null; then \
			tmp=$$(mktemp); \
			op inject -i .claude.json.tmpl -o "$$tmp" -f; \
			if jq -s '.[0] as $$cur | .[1] as $$tmpl | $$cur | .mcpServers = (($$cur.mcpServers // {}) + $$tmpl.mcpServers)' ~/.claude.json "$$tmp" > "$$tmp.merged"; then \
				mv "$$tmp.merged" ~/.claude.json; \
				echo "Merged mcpServers into ~/.claude.json."; \
			else \
				echo "Failed to merge ~/.claude.json; left unchanged."; \
			fi; \
			rm -f "$$tmp" "$$tmp.merged"; \
		else \
			echo "Skipping ~/.claude.json: jq not found."; \
		fi; \
	else \
		echo "Skipping settings.json and ~/.claude.json: 1Password CLI (op) not found."; \
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
# mcp-config.json is templated because it holds the Context7 API key; op inject
# bakes it in, skipped when op is absent.
install-copilot:
	@if [ -d ~/.copilot/scripts ]; then \
		cp .copilot/scripts/statusline.sh ~/.copilot/scripts/statusline.sh; \
		cp .copilot/settings.json ~/.copilot/settings.json; \
		echo "Installed Copilot statusline and settings.json."; \
	else \
		echo "Skipping Copilot statusline: ~/.copilot/scripts does not exist."; \
	fi
	@if [ -d ~/.copilot ]; then \
		if command -v op >/dev/null; then \
			op inject -i .copilot/mcp-config.json.tmpl -o ~/.copilot/mcp-config.json -f; \
			echo "Installed Copilot mcp-config.json."; \
		else \
			echo "Skipping mcp-config.json: 1Password CLI (op) not found."; \
		fi; \
	else \
		echo "Skipping Copilot mcp-config.json: ~/.copilot does not exist."; \
	fi

# OpenCode keeps configuration and model preferences in separate XDG
# directories. config.json is templated because it contains the Context7 API
# key; the other files contain no secrets and are copied verbatim.
install-opencode:
	mkdir -p ~/.config/opencode ~/.local/state/opencode
	cp .config/opencode/tui.json ~/.config/opencode/tui.json
	cp .local/state/opencode/model.json ~/.local/state/opencode/model.json
	@if command -v op >/dev/null; then \
		op inject -i .config/opencode/config.json.tmpl -o ~/.config/opencode/config.json -f; \
		echo "Installed OpenCode config, TUI settings, and model preferences."; \
	else \
		echo "Installed OpenCode TUI settings and model preferences."; \
		echo "Skipping config.json: 1Password CLI (op) not found."; \
	fi

# Google Workspace MCP server (Calendar, Drive, Docs, Sheets, Slides, Gmail,
# Chat). dist/index.js is an unmodified Apache-2.0 prebuilt bundle of upstream
# gemini-cli-extensions/workspace (see mcp/google-workspace/NOTICE). Copied to a
# stable, username-free location every agent's MCP config points at via
# $HOME. Runtime OAuth token files live only in the destination and are never
# overwritten, since they are absent from the source tree.
install-google-workspace-mcp:
	mkdir -p ~/.local/share/google-workspace-mcp
	cp -r mcp/google-workspace/ ~/.local/share/google-workspace-mcp/
	chmod +x ~/.local/share/google-workspace-mcp/launch.sh
	@echo "Installed Google Workspace MCP server."

install: install-claude install-pi install-gemini install-copilot install-opencode install-google-workspace-mcp
