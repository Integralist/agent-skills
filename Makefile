.PHONY: install install-agents install-claude install-pi install-gemini install-copilot install-opencode install-google-workspace-mcp install-tools rules

# Every action runs through scripts/step.sh, which prints one status line and
# swallows the command's output unless it fails — see that file for the modes.
# Recipe lines are silenced with @ so the status lines are the only output.
STEP := bash scripts/step.sh

install-agents:
	@$(STEP) --section "Agents"
	@mkdir -p ~/.agents
	@$(STEP) ".agents/ → ~/.agents/" cp -r .agents/ ~/.agents/

# Shared CLI tools driven by skills in more than one harness. crit (inline
# code-review CLI) is used by both Claude Code and Pi. Installed via Homebrew;
# skipped with guidance when brew is absent.
install-tools:
	@$(STEP) --section "Tools"
	@if command -v brew >/dev/null; then \
		if brew list crit >/dev/null 2>&1; then \
			$(STEP) --ok "crit already installed"; \
		else \
			$(STEP) "crit (brew install)" brew install crit || exit 1; \
		fi; \
	else \
		$(STEP) --skip "crit: Homebrew not found — install manually from https://crit.md/"; \
	fi

# Install Pi, its configured packages, and global settings. The repository
# settings are copied last so they remain the source of truth after pi install
# updates the global package store. mcp.json is templated because it contains
# the Context7 API key; op inject bakes it in, skipped when op is absent.
install-pi: install-tools
	@$(STEP) --section "Pi"
	@$(STEP) "@earendil-works/pi-coding-agent (npm -g)" npm install -g --ignore-scripts @earendil-works/pi-coding-agent
	@for package in npm:@odinlayer/pi-statusbar npm:pi-effort npm:@shuv1337/pi-mcp-adapter npm:pi-intercom git:github.com/Integralist/pi-btw; do \
		$(STEP) "$$package" pi install "$$package" --no-approve || exit 1; \
	done
	@mkdir -p ~/.pi/agent/themes
	@$(STEP) "AGENTS.md → ~/.pi/agent/AGENTS.md" cp .agents/AGENTS.md ~/.pi/agent/AGENTS.md
	@$(STEP) "settings.json → ~/.pi/agent/settings.json" cp .pi/agent/settings.json ~/.pi/agent/settings.json
	@$(STEP) "nord-contrast.json → ~/.pi/agent/themes/" cp .pi/agent/themes/nord-contrast.json ~/.pi/agent/themes/nord-contrast.json
	@if command -v op >/dev/null; then \
		$(STEP) "mcp.json → ~/.pi/agent/mcp.json (op inject)" op inject -i .pi/agent/mcp.json.tmpl -o ~/.pi/agent/mcp.json -f || exit 1; \
	else \
		$(STEP) --skip "mcp.json: 1Password CLI (op) not found"; \
	fi

# Regenerate .claude/rules/{go,markdown}.md from their canonical skills. The
# skill SKILL.md bodies are the single source of truth; rules differ only by
# frontmatter (paths: globs). Run this after editing a *-conventions skill and
# before committing, since the rules are committed.
rules:
	@$(STEP) --section "Rules"
	@$(STEP) "Regenerated .claude/rules/ from skills" bash .claude/scripts/gen-rules.sh

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
# ~/.claude.json holds many settings we don't manage, so scripts/install-claude-json.sh
# merges only our mcpServers into it; that script documents the merge rules and
# needs jq, so the merge is skipped when jq is missing.
install-claude: install-agents rules install-tools
	@$(STEP) --section "Claude"
	@mkdir -p ~/.claude
	@$(STEP) "CLAUDE.md → ~/.claude/CLAUDE.md" cp .claude/CLAUDE.md ~/.claude/CLAUDE.md
	@$(STEP) "rules/ → ~/.claude/rules/" cp -r .claude/rules/ ~/.claude/rules/
	@$(STEP) "agents/ → ~/.claude/agents/" cp -r .claude/agents/ ~/.claude/agents/
	@$(STEP) "scripts/ → ~/.claude/scripts/" cp -r .claude/scripts/ ~/.claude/scripts/
	@rm -rf ~/.claude/skills
	@$(STEP) "~/.claude/skills → ~/.agents/skills (symlink)" ln -s ~/.agents/skills ~/.claude/skills
	@if command -v op >/dev/null; then \
		$(STEP) "settings.json → ~/.claude/settings.json (op inject)" op inject -i .claude/settings.json.tmpl -o ~/.claude/settings.json -f || exit 1; \
		if [ -f ~/.claude.json ] && ! command -v jq >/dev/null; then \
			$(STEP) --skip "mcpServers → ~/.claude.json: jq not found"; \
		else \
			$(STEP) "mcpServers → ~/.claude.json" bash scripts/install-claude-json.sh || exit 1; \
		fi; \
	else \
		$(STEP) --skip "settings.json and ~/.claude.json: 1Password CLI (op) not found"; \
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
	@$(STEP) --section "Gemini"
	@if [ -d ~/.gemini ]; then \
		$(STEP) "settings.json → ~/.gemini/settings.json" cp .gemini/settings.json ~/.gemini/settings.json || exit 1; \
	else \
		$(STEP) --skip "settings.json: ~/.gemini does not exist"; \
	fi
	@if [ -d ~/.gemini/antigravity-cli ]; then \
		$(STEP) "statusline.sh → ~/.gemini/antigravity-cli/" cp .gemini/antigravity-cli/statusline.sh ~/.gemini/antigravity-cli/statusline.sh || exit 1; \
		if command -v op >/dev/null; then \
			$(STEP) "settings.json → ~/.gemini/antigravity-cli/ (op inject)" op inject -i .gemini/antigravity-cli/settings.json.tmpl -o ~/.gemini/antigravity-cli/settings.json -f || exit 1; \
		else \
			$(STEP) --skip "antigravity-cli settings.json: 1Password CLI (op) not found"; \
		fi; \
	else \
		$(STEP) --skip "statusline: ~/.gemini/antigravity-cli does not exist"; \
	fi

# Copilot CLI reads ~/.copilot. Only copy the statusline and settings.json when
# ~/.copilot/scripts already exists, so the target is a no-op when Copilot isn't
# installed. settings.json holds no secrets, so it's committed verbatim.
# mcp-config.json is templated because it holds the Context7 API key; op inject
# bakes it in, skipped when op is absent.
install-copilot:
	@$(STEP) --section "Copilot"
	@if [ -d ~/.copilot/scripts ]; then \
		$(STEP) "statusline.sh → ~/.copilot/scripts/" cp .copilot/scripts/statusline.sh ~/.copilot/scripts/statusline.sh || exit 1; \
		$(STEP) "settings.json → ~/.copilot/settings.json" cp .copilot/settings.json ~/.copilot/settings.json || exit 1; \
	else \
		$(STEP) --skip "statusline and settings.json: ~/.copilot/scripts does not exist"; \
	fi
	@if [ -d ~/.copilot ]; then \
		if command -v op >/dev/null; then \
			$(STEP) "mcp-config.json → ~/.copilot/ (op inject)" op inject -i .copilot/mcp-config.json.tmpl -o ~/.copilot/mcp-config.json -f || exit 1; \
		else \
			$(STEP) --skip "mcp-config.json: 1Password CLI (op) not found"; \
		fi; \
	else \
		$(STEP) --skip "mcp-config.json: ~/.copilot does not exist"; \
	fi

# OpenCode keeps configuration and model preferences in separate XDG
# directories. config.json is templated because it contains the Context7 API
# key; the other files contain no secrets and are copied verbatim.
install-opencode:
	@$(STEP) --section "OpenCode"
	@mkdir -p ~/.config/opencode ~/.local/state/opencode
	@$(STEP) "tui.json → ~/.config/opencode/tui.json" cp .config/opencode/tui.json ~/.config/opencode/tui.json
	@$(STEP) "model.json → ~/.local/state/opencode/model.json" cp .local/state/opencode/model.json ~/.local/state/opencode/model.json
	@if command -v op >/dev/null; then \
		$(STEP) "config.json → ~/.config/opencode/config.json (op inject)" op inject -i .config/opencode/config.json.tmpl -o ~/.config/opencode/config.json -f || exit 1; \
	else \
		$(STEP) --skip "config.json: 1Password CLI (op) not found"; \
	fi

# Google Workspace MCP server (Calendar, Drive, Docs, Sheets, Slides, Gmail,
# Chat). dist/index.js is an unmodified Apache-2.0 prebuilt bundle of upstream
# gemini-cli-extensions/workspace (see mcp/google-workspace/NOTICE). Copied to a
# stable, username-free location every agent's MCP config points at via
# $HOME. Runtime OAuth token files live only in the destination and are never
# overwritten, since they are absent from the source tree.
install-google-workspace-mcp:
	@$(STEP) --section "Google Workspace MCP"
	@mkdir -p ~/.local/share/google-workspace-mcp
	@$(STEP) "mcp/google-workspace/ → ~/.local/share/google-workspace-mcp/" cp -r mcp/google-workspace/ ~/.local/share/google-workspace-mcp/
	@$(STEP) "launch.sh made executable" chmod +x ~/.local/share/google-workspace-mcp/launch.sh

install: install-claude install-pi install-gemini install-copilot install-opencode install-google-workspace-mcp
	@printf '\n✨ All set.\n'
