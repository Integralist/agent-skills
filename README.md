# Agent Skills Configuration

Global configuration for AI coding assistants — skills, agents, rules, and
project instructions shared across every project.

> [!WARNING]
> Some configured skills and plugins are **internal** and will not work for
> everyone. `.claude/settings.json.tmpl` and `.pi/agent/settings.json`
> reference a private repository that is not publicly accessible, so without
> access those entries fail to install. Remove or disable them before running
> the install targets.

> [!NOTE]
> The config templates carry 1Password secret references from an internal
> vault. [`scripts/op-inject.sh`](./scripts/op-inject.sh) resolves them at
> install time and **skips gracefully** when that vault isn't reachable — a
> missing `op` CLI or an unauthenticated account leaves those entries out
> rather than aborting the install.

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

Every target prints one line per action — `✅` done, `💤` skipped because a
prerequisite is missing, `❌` failed. Commands run quietly; a failure prints its
full output and stops the install, so nothing goes wrong silently.

## Maintenance

`make install` checks whether the vendored Google Workspace MCP bundle is behind
the latest upstream stable release and prints a 🔔 line when it is. It never
applies the update itself, because that rewrites tracked files in
`mcp/google-workspace/` and an install shouldn't dirty the working tree. Apply
it when you're ready to commit the bump:

```bash
# Is a newer stable release out? (needs gh)
make check-google-workspace-mcp

# Download it, replace dist/index.js, and bump the recorded ref
make update-google-workspace-mcp

# Re-download the release already vendored
make update-google-workspace-mcp ARGS=--force
```

See [`mcp/google-workspace/README.md`](./mcp/google-workspace/README.md) for what
the update touches and why only stable releases are tracked.

## Structure

```plain
.claude.json.tmpl                   # Global MCP servers (Context7 key templated)

.claude/                            # Claude Code
├── CLAUDE.md                       # @-import pointer to ~/.agents/AGENTS.md
├── agents/                         # Custom sub-agent definitions
├── rules/                          # Conventions auto-loaded by file glob
├── scripts/                        # statusline.sh + session-cost helpers
└── skills -> ../.agents/skills     # Symlink — single source of truth

.gemini/antigravity-cli/            # Gemini Antigravity CLI
└── statusline.sh                   # Status line (mirrors the Claude one)

.copilot/                           # Copilot CLI
├── mcp-config.json.tmpl            # MCP servers (Context7 key templated)
├── settings.json                   # Defaults and TUI settings
└── scripts/statusline.sh           # Status line (mirrors the Claude one)

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
    └── shared/                     # Cross-skill policies and references

scripts/                            # Makefile helpers (not installed anywhere)
├── step.sh                         # One status line per install action
├── install-claude-json.sh          # Merges mcpServers into ~/.claude.json
└── workspace-mcp.sh                # Checks for / applies MCP bundle updates
```

## Components

**Pi** — installed by `make install-pi` with the `pi-statusbar`, `pi-effort`,
`pi-mcp-adapter`, `pi-intercom`, `pi-subagents`, and `pi-btw` packages. The
repository provides a Gemini Flash default, a curated enabled-model list, hidden
thinking blocks, the custom `nord-contrast` theme, and an `mcp.json` (templated
for the Context7 API key) wiring the
Atlassian, fastly, google-workspace, gopls, and Context7 MCP servers.

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
mirrored as skills (`conventions-go`, `conventions-markdown`,
`conventions-python`, `conventions-sql`).

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

Claude Code reads its global MCP servers from `~/.claude.json`, a file that also
holds unrelated settings we don't manage. `make install-claude` therefore
codifies only the `mcpServers` block in `.claude.json.tmpl` (Context7 key as a
1Password reference) and installs it with
[`scripts/install-claude-json.sh`](./scripts/install-claude-json.sh). When
`~/.claude.json` is absent the injected template is
copied verbatim; when it exists, `jq` deep-merges our servers over the current
object — our entries win, manually-added servers survive, and every other
setting is left untouched. The merge path needs `jq`.

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

The **Atlassian** server (Jira, Confluence, Compass) is wired into Pi, Gemini
CLI, Copilot CLI, and OpenCode via their respective config files. Each proxies
the official remote endpoint (`https://mcp.atlassian.com/v1/mcp/authv2`)
through `mcp-remote` with `--transport http-only`, which opens a browser for
OAuth on first run and caches tokens under `~/.mcp-auth` — shared across
harnesses, so you authenticate once (clear with `rm -rf ~/.mcp-auth` to
re-authenticate). Claude Code is intentionally omitted: it reaches Atlassian
through its own connector and the Atlassian plugin.

That endpoint speaks MCP Streamable HTTP. The older HTTP+SSE endpoint
(`https://mcp.atlassian.com/v1/sse`) is deprecated and stops working after
30 June 2026, so `--transport http-only` is explicit: `mcp-remote` defaults to
`http-first`, which silently falls back to SSE on a 404.

The **Portal** server is an internal MCP wired into Claude Code, Pi, Gemini
CLI, Copilot CLI, and OpenCode. Its endpoint URL is a 1Password reference, so
the host name never lands in this public repo. Claude Code uses the native
`http` transport; the others proxy through `mcp-remote`. Either way you
authenticate via SSO on first use.

## Skill reference

| Skill                        | Description                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| **agents-md**                | Make `AGENTS.md` canonical and point `CLAUDE.md` and `GEMINI.md` to it.                |
| **architect**                | Turn an idea into research, a specification, and an implementation plan.               |
| **arena**                    | Spawn N parallel candidates, pick the strongest, and graft in the best of the rest.    |
| **bcp**                      | Create a branch, commit changes, and open a PR or submit its stack.                    |
| **behaviour-spec**           | Write Gherkin acceptance criteria and Go test scaffolding.                             |
| **branch**                   | Create a feature branch named from the current task.                                   |
| **caveman**                  | Use technically accurate, token-saving caveman speech.                                 |
| **changelog**                | Add a changelog entry for uncommitted or branch changes.                               |
| **clarify**                  | Resolve ambiguous requirements before work begins.                                     |
| **cleanup**                  | Audit AI-generated clutter, then apply approved fixes interactively.                   |
| **code-review**              | Review changes for correctness, security, reliability, and maintainability.            |
| **code-review-feedback**     | Verify review feedback before accepting or implementing it.                            |
| **commit**                   | Group related changes and create clear Git commits.                                    |
| **consensus**                | Reach cross-model consensus through gated discussion rounds.                           |
| **conventions-go**           | Apply Go conventions when editing or reviewing `.go` files.                            |
| **conventions-markdown**     | Apply Markdown conventions when editing or reviewing `.md` files.                      |
| **conventions-python**       | Apply Python conventions when editing or reviewing `.py` files.                        |
| **conventions-sql**          | Apply SQL conventions when editing or creating migration files.                        |
| **critique**                 | Find logical weaknesses in a document and suggest fixes.                               |
| **decide**                   | Compare consequential options and record a reasoned decision.                          |
| **delegate**                 | Choose and dispatch the right subagent for a task.                                     |
| **distill**                  | Shorten long prose without losing essential information.                               |
| **domain-modeling**          | Define shared domain language and record architecture decisions.                       |
| **draft-pr**                 | Write and open a concise PR with clear Problem and Solution sections.                  |
| **durable-rules**            | Turn recurring findings into durable conventions or anti-patterns.                     |
| **eval**                     | Create and run skill evaluations, then compare with the previous run.                  |
| **git-metadata**             | Analyze Git history for churn, ownership risk, defect clusters, velocity, and crises.  |
| **ghostty**                  | Control Ghostty terminal (macOS) to manage splits, tabs, and out-of-band jobs.         |
| **go-api**                   | Scaffold a production-ready Go API with local tooling and observability.               |
| **go-testing**               | Write Go unit, integration, fuzz, and benchmark tests.                                 |
| **grepai**                   | Search code semantically when exact names are unknown.                                 |
| **grill-me**                 | Start a grilling session for a plan, decision, or idea.                                |
| **grill-with-docs**          | Grill an idea while updating its glossary and ADRs.                                    |
| **grilling**                 | Stress-test assumptions through a structured, relentless interview.                    |
| **handoff**                  | Summarize the current session for another agent.                                       |
| **incident-report**          | Write an incident report from the session's debugging evidence.                        |
| **markdown-to-skill**        | Convert a directory of Markdown documents into agent skills.                           |
| **mysql-index-audit**        | Find MySQL leftmost-prefix violations, index gaps, and unusable indexes.               |
| **next-task**                | Implement and complete the next actionable plan or task-list item.                     |
| **perspectives**             | Explore a proposal's evidence, sentiment, risks, benefits, alternatives, and process.  |
| **polish**                   | Improve a short passage's clarity and concision.                                       |
| **precedent**                | Align work with patterns established by peer files.                                    |
| **project-plan**             | Write a specification-backed plan with vertical slices, dependencies, and PR grouping. |
| **recap**                    | Summarize what is done, in progress, and next.                                         |
| **redesign**                 | Audit a codebase for redesigns that remove structural complexity.                      |
| **refactor**                 | Plan a simpler reimplementation of an existing feature.                                |
| **research**                 | Research a topic or repository and save a sourced reference under `docs/research/`.    |
| **security-review-feedback** | Validate vulnerability findings for reachability and exploitability before fixing.     |
| **stacked-prs**              | Create and manage dependent PRs with the official `gh stack` extension.                |
| **summarize-for-product**    | Translate engineering changes into a non-technical update.                             |
| **systematic-debugging**     | Find root causes through a four-phase debugging workflow.                              |
| **tasks**                    | Write a checkbox-driven TDD task list with code, checks, and PR grouping.              |
| **teach**                    | Teach a concept using persistent lessons, missions, and progress records.              |
| **tech-docs**                | Write or improve concise, maintainable technical documentation.                        |
| **test-feedback**            | Diagnose supplied test failures, then fix them interactively.                          |
| **to-adr**                   | Extract genuine architecture decisions into standalone ADRs.                           |
| **to-prd**                   | Extract product goals, scope, and success measures into a PRD.                         |
| **to-spec**                  | Write an implementation-ready feature spec with scope and acceptance criteria.         |
| **unslop**                   | Cut AI tells and machine cadence from prose to restore human voice.                    |
| **wait-what**                | Re-pitch a message that did not land.                                                  |
| **writing-for-agents**       | Apply conventions that make skills and instruction files predictable.                  |

## Choosing an analysis skill

| Skill            | Use when                                                                                   | Primary output                                               |
| ---------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **code-review**  | Code or a diff exists and you want defects identified                                      | Verified findings and open questions                         |
| **precedent**    | Work is correct and you want it to match the project's own patterns                        | Divergences citing the peer that sets each pattern           |
| **decide**       | You must choose between consequential options                                              | Durable decision memo and recommendation                     |
| **consensus**    | A complex design or implementation needs independent cross-model review and approval gates | Reviewed assessment or implementation with dissent preserved |
| **perspectives** | You want quick breadth, brainstorming, or a structured "what are we missing?" pass         | Multi-perspective analysis and next step                     |
| **arena**        | One attempt at a non-trivial artifact risks locking in the wrong shape                     | One artifact synthesized from parallel candidates            |

Common sequences:

- Unclear problem space: **perspectives** → **decide**
- Consequential engineering choice: **decide** → **consensus**
- Complex implementation: **consensus**, which invokes **code-review** before
  cross-model implementation review
- Ordinary pull request or local diff: **code-review**
- New code that works but may not look like its neighbours: **precedent**
- Quick meeting or brainstorming pass: **perspectives**
- Non-trivial artifact where the first shape tends to stick: **arena**

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

`.claude/rules/go.md`, `.claude/rules/markdown.md`, `.claude/rules/python.md`,
and `.claude/rules/sql.md` are **generated** from the `conventions-go`,
`conventions-markdown`, `conventions-python`, and `conventions-sql` skills. The
`SKILL.md` is the single source of truth; the rule
differs only by frontmatter (`paths:` globs in place of `name:`/`description:`),
and the bodies stay byte-identical.

Regenerate with `make rules` (runs `.claude/scripts/gen-rules.sh`); `make install` runs it automatically. After editing a `conventions-*` skill, run `make rules` before committing — the generated rules are committed.

## Workflow

Core implementation flow:

```txt
architect → next-task → commit → code-review
```

Plans and task lists can group several tasks into each review unit. When those
units depend on each other, **stacked-prs** creates and manages the branches and
PRs with `gh stack`.

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
