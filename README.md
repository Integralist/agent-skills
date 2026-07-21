# Agent Skills Configuration

Global configuration for AI coding assistants — skills, agents, rules, and
project instructions shared across every project.

## Mental model

The repo serves multiple harnesses from one set of files:

- **Claude Code** reads `.claude/` (CLAUDE.md, agents, rules, and a `skills`
  symlink).
- **Generic agents** (e.g. Gemini and OpenCode) read `.agents/` (skills,
  AGENTS.md).
- **Pi** reads `.pi/agent/` for its settings and theme; `make install-pi` also
  copies the shared `AGENTS.md` and installs its configured packages.

Skills have a **single source of truth**: `.agents/skills/`. `.claude/skills`
is a symlink to it, so each skill is edited once and both harnesses see it.
Skill content stays harness-agnostic — generic language ("prompt the user",
"spawn a subagent"). Claude-only guidance lives in a clearly-labeled optional
"Agent teams (if your harness supports it)" section that other harnesses
ignore.

Everything else is a thin adapter around that shared core:

| Asset       | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `CLAUDE.md` | One-line `@~/.agents/AGENTS.md` import — same conventions        |
| `AGENTS.md` | The canonical global conventions                                 |
| `rules/`    | Path-glob auto-loaded conventions (generic harnesses use skills) |
| `agents/`   | Custom sub-agent definitions spawned via the Task tool           |
| `scripts/`  | Statusline and session-cost helpers                              |

## Install

```bash
# Generic agents only (e.g. Gemini and OpenCode): copies .agents/ to ~/.agents/
make install-agents

# Pi: installs Pi, configured packages, shared instructions, and settings
make install-pi

# Claude Code (pulls in install-agents): copies CLAUDE.md, rules, agents, and
# scripts to ~/.claude/, then symlinks ~/.claude/skills → ~/.agents/skills
make install-claude

# Gemini Antigravity CLI status line (no-op if ~/.gemini/antigravity-cli absent)
make install-gemini

# Copilot CLI status line (no-op if ~/.copilot/scripts absent)
make install-copilot

# OpenCode config, TUI settings, and model preferences
make install-opencode

# Google Workspace MCP server → ~/.local/share/google-workspace-mcp/
make install-google-workspace-mcp

# Everything (install-claude pulls in install-agents; also runs the above)
make install
```

## Structure

```plain
.claude/                            # Claude Code
├── CLAUDE.md                       # @-import pointer to ~/.agents/AGENTS.md
├── agents/                         # Custom sub-agent definitions
├── rules/                          # Conventions auto-loaded by file glob
├── scripts/                        # statusline.sh + session-cost helpers
└── skills -> ../.agents/skills     # Symlink — single source of truth

.gemini/antigravity-cli/            # Gemini Antigravity CLI
└── statusline.sh                   # Status line (mirrors the Claude one)

.copilot/scripts/                   # Copilot CLI
└── statusline.sh                   # Status line (mirrors the Claude one)

.config/opencode/                   # OpenCode config
├── config.json.tmpl                # Main config with 1Password secret reference
└── tui.json                        # Notifications and TUI settings

.local/state/opencode/
└── model.json                      # Favorite models and variants

mcp/google-workspace/               # Google Workspace MCP server (all agents)
├── dist/index.js                   # Apache-2.0 upstream bundle (self-contained)
├── launch.sh                       # Self-locating launcher; resolves node
└── gemini-extension.json           # Anchors OAuth token storage to install dir

.pi/agent/                          # Pi configuration
├── settings.json                   # Defaults, enabled models, and packages
└── themes/nord-contrast.json       # Custom Pi theme

.agents/                            # Canonical skills + conventions
├── AGENTS.md                       # Shared conventions
└── skills/                         # One directory per skill (see table below)
    └── shared/                     # Cross-skill references (Agent teams, etc.)
```

## Components

**Pi** — installed by `make install-pi` with the `pi-statusbar`, `pi-effort`,
and `pi-mcp-adapter` packages. The repository provides a Gemini Flash default, a
curated enabled-model list, hidden thinking blocks, the custom `nord-contrast`
theme, and an `mcp.json` (templated for the Context7 API key) wiring the
google-workspace, gopls, and Context7 MCP servers.

**Skills** — reusable instructions that extend an agent with a task, pattern, or
specialized knowledge. Depending on frontmatter, agents discover them from the
request or users invoke them explicitly with `/skill-name`. See
[the docs](https://code.claude.com/docs/en/skills).

**[Agents](https://code.claude.com/docs/en/agents)** (`.claude/agents/`) —
specialized sub-agents Claude spawns via the Task tool, each with its own model
and instructions. Current agent: **code-improvement-reviewer** — reviews code
for readability, performance, and best practices with concrete before/after
suggestions.

**[Rules](https://code.claude.com/docs/en/memory#modular-rules-with-claude%2Frules%2F)**
(`.claude/rules/`) — topic-specific instructions Claude loads automatically,
scoped to file patterns via a YAML `paths` glob. Unlike skills, they apply
passively. Generic agents don't support path-scoped auto-loading, so these are
mirrored as skills (`go-conventions`, `markdown-conventions`).

**Project instructions** — `.agents/AGENTS.md` holds the canonical conventions;
`.claude/CLAUDE.md` is a one-line `@~/.agents/AGENTS.md` pointer so Claude Code
loads the same set.

## MCP servers

`mcp/google-workspace/` bundles a self-contained Google Workspace MCP server
(Calendar, Drive, Docs, Sheets, Slides, Gmail, Chat, People) usable by any
MCP-capable agent. It's an unmodified Apache-2.0 build of upstream
[`gemini-cli-extensions/workspace`](https://github.com/gemini-cli-extensions/workspace)
— see [`mcp/google-workspace/README.md`](./mcp/google-workspace/README.md) for
provenance, authentication, and update steps.

`make install-google-workspace-mcp` copies it to
`~/.local/share/google-workspace-mcp/`. Agent configs reference that path via
`$HOME`, so nothing is tied to a username. opencode, Gemini CLI, and Pi are
wired automatically (Pi via `.pi/agent/mcp.json.tmpl`, alongside the gopls and
Context7 servers); register it with Claude Code once:

```bash
claude mcp add google-workspace -- \
  bash -c 'exec "$HOME/.local/share/google-workspace-mcp/launch.sh"'
```

Each user authenticates to their own Google account via browser OAuth on first
use; there are no shared credentials.

## Skill reference

| Skill                        | Description                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **agents-md**                | Make AGENTS.md canonical; stub CLAUDE.md/GEMINI.md as @-import pointers                                                                |
| **architect**                | Design-and-plan coordinator: bootstrap → research → spec → plan (idea to artifacts)                                                    |
| **bcp**                      | Branch, commit, and open a PR in one step (orchestrates **branch** + **commit** + **draft-pr**)                                        |
| **behaviour-spec**           | Generate Gherkin acceptance criteria; executable godog scenarios for Go, prose for units                                               |
| **branch**                   | Create a git feature branch named from session context (slug username + kebab slug)                                                    |
| **caveman**                  | Ultra-compressed caveman-speak mode; ~75% token reduction                                                                              |
| **changelog**                | Add a Keep a Changelog entry from the working diff or branch-vs-main                                                                   |
| **clarify**                  | Elicit and pin down the user's intent before starting work; front of the design pipeline                                               |
| **cleanup**                  | Audit codebase for AI slop via background subagent                                                                                     |
| **code-review**              | Multi-dimensional review via parallel subagents                                                                                        |
| **code-review-feedback**     | Evaluate code review feedback with technical rigor — verify before implementing                                                        |
| **commit**                   | Git commits with intelligent file grouping                                                                                             |
| **consensus**                | Cross-model second-opinion workflow with discussion rounds and user gates                                                              |
| **critique**                 | Critique a document for logical fallacies                                                                                              |
| **decide**                   | Decision memo with structurer, contrarian, and synthesizer passes                                                                      |
| **delegate**                 | Spawn a subagent for a task                                                                                                            |
| **distill**                  | Rewrite text concisely without losing critical info; inventory → rewrite → audit                                                       |
| **domain-modeling**          | Build and sharpen a project's domain model — glossary (CONTEXT.md) and ADRs                                                            |
| **draft-pr**                 | Draft a concise, direct pull request with a clear Problem and Solution                                                                 |
| **durable-rules**            | Surface systemic patterns from an investigation as codified conventions or anti-patterns                                               |
| **git-metadata**             | Git-history diagnostic snapshot — churn hotspots, bus factor, bug clusters, velocity, crises                                           |
| **go-api**                   | Generate a production-ready Go API service                                                                                             |
| **go-conventions**           | Go coding conventions (mirrors `.claude/rules/go.md`)                                                                                  |
| **go-testing**               | Write Go tests — table-driven, fuzz, benchmarks                                                                                        |
| **grepai**                   | Semantic code search by intent                                                                                                         |
| **grill-me**                 | Thin delegator → runs a **grilling** session                                                                                           |
| **grill-with-docs**          | Thin delegator → runs **grilling** with **domain-modeling**                                                                            |
| **grilling**                 | Interview the user relentlessly to stress-test a plan or design                                                                        |
| **handoff**                  | Compact the current conversation into a handoff document for another agent                                                             |
| **incident-report**          | Write up a session's incident debugging into a report at `docs/reports/` — timeline, impact, fixes                                     |
| **markdown-conventions**     | Markdown formatting conventions (mirrors `.claude/rules/markdown.md`)                                                                  |
| **markdown-to-skill**        | Bulk-convert Markdown files into agent skills                                                                                          |
| **mysql-index-audit**        | Statically audit a codebase for MySQL index misuse (leftmost-prefix, gaps, killers)                                                    |
| **next-task**                | Continue working through a project plan                                                                                                |
| **perspectives**             | Explore evidence, sentiment, risks, benefits, alternatives, and process                                                                |
| **project-plan**             | Implementation plan from a spec; vertical slices with Blocked-by edges, extracts ADRs via to-adr                                       |
| **redesign**                 | Codebase-wide aspirational audit; produces phased redesign plan with mandatory test pinning                                            |
| **refactor**                 | Analyze a feature and produce a reimplementation plan                                                                                  |
| **research**                 | Research a topic or repo deeply; writes a reference doc to `docs/research/`                                                            |
| **security-review-feedback** | Triage a security review's findings — verdict per finding (true/false positive) before fixing                                          |
| **summarize-for-product**    | Translate a plan doc or branch diff into a non-engineer summary (PR/Slack/email)                                                       |
| **systematic-debugging**     | Four-phase debugging with root cause analysis                                                                                          |
| **tasks**                    | Crystallize the in-session plan into a mechanical, TDD-shaped task list at `docs/tasks/`; verbatim test + code + per-task verification |
| **teach**                    | Stateful tutor workspace — missions, lessons, learning records, reference docs                                                         |
| **tech-docs**                | Write or improve technical documentation via five documentation pillars                                                                |
| **test-feedback**            | Parse test failures and fix them in a background subagent                                                                              |
| **to-adr**                   | Extract a formal ADR (one per decision) from a plan or design doc                                                                      |
| **to-prd**                   | Extract a focused PRD (product what & why) from a spec or plan                                                                         |
| **to-spec**                  | Write a spec to `docs/specifications/` — problem, solution, stories, acceptance criteria, seams                                        |
| **writing-great-skills**     | Reference for writing and editing skills well — vocabulary and principles for predictability                                           |

## Choosing an analysis skill

| Skill            | Use when                                                                                   | Primary output                                               |
| ---------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **code-review**  | Code or a diff exists and you want defects identified                                      | Verified findings and open questions                         |
| **decide**       | You must choose between consequential options                                              | Durable decision memo and recommendation                     |
| **consensus**    | A complex design or implementation needs independent cross-model review and approval gates | Reviewed assessment or implementation with dissent preserved |
| **perspectives** | You want quick breadth, brainstorming, or a structured "what are we missing?" pass         | Multi-perspective analysis and next step                     |

Common sequences:

- Unclear problem space: **perspectives** → **decide**
- Consequential engineering choice: **decide** → **consensus**
- Complex implementation: **consensus**, which invokes **code-review** before
  cross-model implementation review
- Ordinary pull request or local diff: **code-review**
- Quick meeting or brainstorming pass: **perspectives**

## Claude-specific frontmatter

Skill bodies are harness-agnostic, but some YAML frontmatter keys are read only
by Claude Code. They're safe in shared skills — other harnesses ignore unknown
keys.

| Field                      | Where        | Purpose                                                             |
| -------------------------- | ------------ | ------------------------------------------------------------------- |
| `user-invocable`           | `SKILL.md`   | Exposes the skill as a `/skill-name` slash command                  |
| `argument-hint`            | `SKILL.md`   | Placeholder text shown after the slash command in the prompt        |
| `allowed-tools`            | `SKILL.md`   | Pre-approves specific tool calls (e.g. `Bash(git diff:*)`)          |
| `disable-model-invocation` | `SKILL.md`   | Prevents auto-invocation; user must call the skill explicitly       |
| `arguments`                | `SKILL.md`   | Structured argument definitions for a slash command                 |
| `paths`                    | `rules/*.md` | Glob patterns that auto-load a rule when matching files are touched |

## Generating rules from skills

`.claude/rules/go.md` and `.claude/rules/markdown.md` are **generated** from the
`go-conventions` and `markdown-conventions` skills. The `SKILL.md` is the single
source of truth; the rule differs only by frontmatter (`paths:` globs in place
of `name:`/`description:`), and the bodies stay byte-identical.

Regenerate with `make rules` (runs `.claude/scripts/gen-rules.sh`); `make install` runs it automatically. After editing a `*-conventions` skill, run `make rules` before committing — the generated rules are committed.

## Workflow

Core implementation flow:

```txt
architect → next-task → commit → code-review
```

Optional branches:

- **critique** — review a plan or document before implementation
- **cleanup** — remove AI-generated clutter
- **refactor** — plan a simpler reimplementation of an existing feature
- **redesign** — audit the wider codebase for structural simplification

## Contributing

1. Ensure additions are truly **global** — applicable across multiple projects.
1. Write clear, concise descriptions so agents interpret them accurately.
1. Include examples where helpful; avoid project-specific details.
1. Add new skills under `.agents/skills/<name>/` only — the `.claude/skills`
   symlink picks them up. Keep content harness-agnostic; put Claude-only
   guidance in an optional "Agent teams (if your harness supports it)" section.
1. Test with Claude to confirm the desired behavior.

## License

Personal coding skills and preferences. Feel free to use and adapt them for your
own projects.
