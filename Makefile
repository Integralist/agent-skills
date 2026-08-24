.PHONY: install install-agents install-claude install-pi install-gemini install-copilot install-opencode install-google-workspace-mcp install-tools rules check-google-workspace-mcp update-google-workspace-mcp

# Every action runs through scripts/step.sh, which prints one status line and
# swallows the command's output unless it fails — see that file for the modes.
# Recipe lines are silenced with @ so the status lines are the only output.
STEP := bash scripts/step.sh
OPINJECT := bash scripts/op-inject.sh

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
# the Context7 API key; scripts/op-inject.sh bakes it in, skipping gracefully
# without Fastly 1Password access.
install-pi: install-tools
	@$(STEP) --section "Pi"
	@$(STEP) "@earendil-works/pi-coding-agent (npm -g)" npm install -g --ignore-scripts @earendil-works/pi-coding-agent
	@for package in git:github.com/Integralist/pi-statusbar npm:@shuv1337/pi-mcp-adapter npm:pi-intercom git:github.com/Integralist/pi-subagents git:github.com/Integralist/pi-btw; do \
		$(STEP) "$$package" pi install "$$package" --no-approve || exit 1; \
	done
	@mkdir -p ~/.pi/agent/themes
	@$(STEP) "AGENTS.md → ~/.pi/agent/AGENTS.md" cp .agents/AGENTS.md ~/.pi/agent/AGENTS.md
	@$(STEP) "settings.json → ~/.pi/agent/settings.json" cp .pi/agent/settings.json ~/.pi/agent/settings.json
	@$(STEP) "nord-contrast.json → ~/.pi/agent/themes/" cp .pi/agent/themes/nord-contrast.json ~/.pi/agent/themes/nord-contrast.json
	@$(OPINJECT) "mcp.json → ~/.pi/agent/mcp.json" .pi/agent/mcp.json.tmpl ~/.pi/agent/mcp.json

# Regenerate .claude/rules/{go,markdown,python,sql}.md from their canonical
# skills. The skill SKILL.md bodies are the single source of truth; rules differ
# only by frontmatter (paths: globs). Run this after editing a conventions-*
# skill and before committing, since the rules are committed.
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
# the ID. scripts/op-inject.sh interpolates it into the installed file,
# skipping gracefully without Fastly 1Password access.
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
	@$(OPINJECT) "settings.json → ~/.claude/settings.json" .claude/settings.json.tmpl ~/.claude/settings.json
	@if ! command -v op >/dev/null; then \
		$(STEP) --skip "mcpServers → ~/.claude.json: 1Password CLI (op) not found"; \
	elif ! $(OPINJECT) --check; then \
		$(STEP) --skip "mcpServers → ~/.claude.json: no Fastly 1Password access"; \
	elif [ -f ~/.claude.json ] && ! command -v jq >/dev/null; then \
		$(STEP) --skip "mcpServers → ~/.claude.json: jq not found"; \
	else \
		$(STEP) "mcpServers → ~/.claude.json" bash scripts/install-claude-json.sh || exit 1; \
	fi

# Gemini CLI reads ~/.gemini; the Antigravity CLI reads ~/.gemini/antigravity-cli.
# Each part is a no-op when its directory is absent, so the target works on
# machines where only one (or neither) is installed.
#
# Both settings.json files hold a 1Password secret reference — the portal MCP
# URL for ~/.gemini, the Google VertexAI project ID for antigravity — so both
# are templated (settings.json.tmpl). scripts/op-inject.sh interpolates them
# into the installed files, skipping gracefully without Fastly 1Password access.
install-gemini:
	@$(STEP) --section "Gemini"
	@if [ -d ~/.gemini ]; then \
		$(OPINJECT) "settings.json → ~/.gemini/settings.json" .gemini/settings.json.tmpl ~/.gemini/settings.json; \
	else \
		$(STEP) --skip "settings.json: ~/.gemini does not exist"; \
	fi
	@if [ -d ~/.gemini/antigravity-cli ]; then \
		$(STEP) "statusline.sh → ~/.gemini/antigravity-cli/" cp .gemini/antigravity-cli/statusline.sh ~/.gemini/antigravity-cli/statusline.sh || exit 1; \
		$(OPINJECT) "settings.json → ~/.gemini/antigravity-cli/" .gemini/antigravity-cli/settings.json.tmpl ~/.gemini/antigravity-cli/settings.json; \
	else \
		$(STEP) --skip "statusline: ~/.gemini/antigravity-cli does not exist"; \
	fi

# Copilot CLI reads ~/.copilot. Only copy the statusline and settings.json when
# ~/.copilot/scripts already exists, so the target is a no-op when Copilot isn't
# installed. settings.json holds no secrets, so it's committed verbatim.
# mcp-config.json is templated because it holds the Context7 API key;
# scripts/op-inject.sh bakes it in, skipping gracefully without Fastly
# 1Password access.
install-copilot:
	@$(STEP) --section "Copilot"
	@if [ -d ~/.copilot/scripts ]; then \
		$(STEP) "statusline.sh → ~/.copilot/scripts/" cp .copilot/scripts/statusline.sh ~/.copilot/scripts/statusline.sh || exit 1; \
		$(STEP) "settings.json → ~/.copilot/settings.json" cp .copilot/settings.json ~/.copilot/settings.json || exit 1; \
	else \
		$(STEP) --skip "statusline and settings.json: ~/.copilot/scripts does not exist"; \
	fi
	@if [ -d ~/.copilot ]; then \
		$(OPINJECT) "mcp-config.json → ~/.copilot/" .copilot/mcp-config.json.tmpl ~/.copilot/mcp-config.json; \
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
	@$(OPINJECT) "config.json → ~/.config/opencode/config.json" .config/opencode/config.json.tmpl ~/.config/opencode/config.json

# Google Workspace MCP server (Calendar, Drive, Docs, Sheets, Slides, Gmail,
# Chat). dist/index.js is an unmodified Apache-2.0 prebuilt bundle of upstream
# gemini-cli-extensions/workspace (see mcp/google-workspace/NOTICE). Copied to a
# stable, username-free location every agent's MCP config points at via
# $HOME. Runtime OAuth token files live only in the destination and are never
# overwritten, since they are absent from the source tree.
#
# The vendored bundle is only *checked* against the latest upstream stable
# release here, never replaced: applying an update rewrites tracked files, and
# an install has no business leaving the working tree dirty. An outdated bundle
# prints a line pointing at update-google-workspace-mcp, which you run when
# you're ready to review and commit the bump.
install-google-workspace-mcp:
	@$(STEP) --section "Google Workspace MCP"
	@bash scripts/workspace-mcp.sh check
	@mkdir -p ~/.local/share/google-workspace-mcp
	@$(STEP) "mcp/google-workspace/ → ~/.local/share/google-workspace-mcp/" cp -r mcp/google-workspace/ ~/.local/share/google-workspace-mcp/
	@$(STEP) "launch.sh made executable" chmod +x ~/.local/share/google-workspace-mcp/launch.sh

# Compare the vendored Google Workspace bundle against the latest upstream
# stable release, and pull a newer one in when there is one. update rewrites
# dist/index.js and the ref recorded in gemini-extension.json, NOTICE, and the
# directory README — review the diff and commit it. Pass ARGS=--force to
# re-download the release already vendored.
check-google-workspace-mcp:
	@$(STEP) --section "Google Workspace MCP"
	@bash scripts/workspace-mcp.sh check

update-google-workspace-mcp:
	@$(STEP) --section "Google Workspace MCP"
	@bash scripts/workspace-mcp.sh update $(ARGS)

install: install-claude install-pi install-gemini install-copilot install-opencode install-google-workspace-mcp
	@printf '\n✨ All set.\n'
