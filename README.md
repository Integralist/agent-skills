# Agent Skills Configuration

This repository contains **global agent configuration** — skills, agents, rules,
and project instructions designed to be used across all projects when working
with AI coding assistants.

It serves two targets:

- **Claude Code** — reads `.claude/` (CLAUDE.md, agents, rules, and a `skills`
  symlink)
- **Generic Agent Skills** (e.g. Swival) — reads `.agents/` (skills, AGENTS.md)

Skills have a **single source of truth**: `.agents/skills/`. `.claude/skills` is
a symlink to `.agents/skills`, so each skill is edited once and both harnesses
see it. Skill content is harness-agnostic — generic language ("prompt the user",
"spawn a subagent"). Any Claude-only guidance (e.g. agent teams) lives in a
clearly-labeled optional "Agent teams (if your harness supports it)" section so
other harnesses can ignore it.

## Install

```bash
# Generic agents only (e.g. Swival): copies .agents/ to ~/.agents/
make install-agents

# Claude Code (also installs agents as a prerequisite): copies CLAUDE.md, rules,
# agents, and scripts to ~/.claude/, then symlinks ~/.claude/skills →
# ~/.agents/skills
make install-claude

# Everything (install-claude already pulls in install-agents)
make install
```

## Structure

```plain
.claude/                            # Claude Code
├── CLAUDE.md                       # @-import pointer to ~/.agents/AGENTS.md
├── agents/
│   └── code-improvement-reviewer.md
├── rules/
│   ├── go.md                       # Go conventions (auto-loaded for *.go)
│   └── markdown.md                 # Markdown conventions (auto-loaded for *.md)
├── scripts/                        # Statusline + session-cost helpers
└── skills -> ../.agents/skills     # Symlink — single source of truth

.agents/                            # Canonical skills + conventions
├── AGENTS.md                       # Shared conventions
└── skills/
    ├── _shared/                    # Cross-skill references (Agent teams, etc.)
    ├── agents-md/
    ├── bcp/
    ├── behaviour-spec/
    ├── caveman/
    ├── changelog/
    ├── cleanup/
    ├── code-review/
    ├── code-review-feedback/
    ├── commit/
    ├── consensus/
    ├── critique/
    ├── decide/
    ├── delegate/
    ├── distill/
    ├── draft-pr/
    ├── durable-rules/
    ├── extract-doc/
    ├── git-metadata/
    ├── go-api/
    ├── go-conventions/             # rule → skill (generic harnesses)
    ├── go-testing/
    ├── grepai/
    ├── grill-me/
    ├── grill-with-docs/
    ├── handoff/
    ├── markdown-conventions/       # rule → skill (generic harnesses)
    ├── markdown-to-skill/
    ├── mysql-index-audit/
    ├── next-task/
    ├── project-plan/
    ├── redesign/
    ├── refactor/
    ├── research/
    ├── research-plan/
    ├── security-review-feedback/
    ├── slack-search/
    ├── summarize-for-product/
    ├── systematic-debugging/
    ├── teach/
    ├── tech-docs/
    ├── test-feedback/
    ├── writing-great-skills/
```

## Components

### Skills

[Skills](https://code.claude.com/docs/en/skills) are custom code capabilities
that extend an agent's ability to perform specific tasks, follow particular
patterns, or apply specialized knowledge. Skills act as reusable instructions
invoked with `/skill-name`.

### Agents (`.claude/agents/`)

[Custom agents](https://code.claude.com/docs/en/agents) are specialized
sub-agents that Claude can spawn via the Task tool. Each agent has a specific
purpose and can be configured with different models and instructions.

Current agents:

- **code-improvement-reviewer** — Reviews code for readability, performance, and
  best practices with concrete before/after suggestions

### Rules (`.claude/rules/`)

[Rules](https://code.claude.com/docs/en/memory#modular-rules-with-claude%2Frules%2F)
are modular, topic-specific instruction files that Claude loads automatically.
Unlike skills (which are invoked explicitly), rules apply passively — scoped to
file patterns via YAML frontmatter `paths` globs.

In `.agents/`, rules are converted to skills (`go-conventions`,
`markdown-conventions`) since generic agents don't support path-scoped
auto-loading.

### Project Instructions

- `.agents/AGENTS.md` — the canonical global conventions
- `.claude/CLAUDE.md` — a one-line `@~/.agents/AGENTS.md` pointer so Claude Code
  loads the same conventions

## Skill Reference

| Skill                        | Description                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| **agents-md**                | Make AGENTS.md canonical; stub CLAUDE.md/GEMINI.md as @-import pointers                       |
| **bcp**                      | Branch, commit, and open a PR in one step (orchestrates **commit** + **draft-pr**)            |
| **behaviour-spec**           | Generate Gherkin acceptance criteria; executable godog scenarios for Go, prose for units      |
| **caveman**                  | Ultra-compressed caveman-speak mode; ~75% token reduction                                     |
| **changelog**                | Add a Keep a Changelog entry from the working diff or branch-vs-main                          |
| **cleanup**                  | Audit codebase for AI slop via background subagent                                            |
| **code-review**              | Multi-dimensional review via parallel subagents                                               |
| **code-review-feedback**     | Evaluate code review feedback with technical rigor — verify before implementing               |
| **commit**                   | Git commits with intelligent file grouping                                                    |
| **consensus**                | Cross-model second-opinion workflow with discussion rounds and user gates                     |
| **critique**                 | Critique a document for logical fallacies                                                     |
| **decide**                   | Decision memo with structurer, contrarian, and synthesizer passes                             |
| **delegate**                 | Spawn a subagent for a task                                                                   |
| **distill**                  | Rewrite text concisely without losing critical info; inventory → rewrite → audit              |
| **draft-pr**                 | Draft a concise, direct pull request with a clear Problem and Solution                        |
| **durable-rules**            | Surface systemic patterns from an investigation as codified conventions or anti-patterns      |
| **extract-doc**              | Extract a formal ADR and/or PRD from an existing implementation plan (auto-detects format)    |
| **git-metadata**             | Git-history diagnostic snapshot — churn hotspots, bus factor, bug clusters, velocity, crises  |
| **go-api**                   | Generate a production-ready Go API service                                                    |
| **go-conventions**           | Go coding conventions (mirrors `.claude/rules/go.md`)                                         |
| **go-testing**               | Write Go tests — table-driven, fuzz, benchmarks                                               |
| **grepai**                   | Semantic code search by intent                                                                |
| **grill-me**                 | Interview the user relentlessly to stress-test a plan or design                               |
| **grill-with-docs**          | Stress-test a plan against project domain model and update CONTEXT/ADRs                       |
| **handoff**                  | Compact the current conversation into a handoff document for another agent                    |
| **markdown-conventions**     | Markdown formatting conventions (mirrors `.claude/rules/markdown.md`)                         |
| **markdown-to-skill**        | Bulk-convert Markdown files into agent skills                                                 |
| **mysql-index-audit**        | Statically audit a codebase for MySQL index misuse (leftmost-prefix, gaps, killers)           |
| **next-task**                | Continue working through a project plan                                                       |
| **project-plan**             | Create an implementation plan from research; embeds BDD criteria, extracts ADR/PRD            |
| **redesign**                 | Codebase-wide aspirational audit; produces phased redesign plan with mandatory test pinning   |
| **refactor**                 | Analyze a feature and produce a reimplementation plan                                         |
| **research**                 | Research a topic or repo deeply; writes a reference doc to `docs/research/`                   |
| **research-plan**            | Coordinator: research (**research**) then plan (**project-plan**); bootstraps AGENTS.md       |
| **security-review-feedback** | Triage a security review's findings — verdict per finding (true/false positive) before fixing |
| **slack-search**             | Drive Slack via Playwright MCP to run searches or Slackbot prompts                            |
| **summarize-for-product**    | Translate a plan doc or branch diff into a non-engineer summary (PR/Slack/email)              |
| **systematic-debugging**     | Four-phase debugging with root cause analysis                                                 |
| **teach**                    | Stateful tutor workspace — missions, lessons, learning records, reference docs                |
| **tech-docs**                | Write or improve technical documentation via five documentation pillars                       |
| **test-feedback**            | Parse test failures and fix them in a background subagent                                     |
| **writing-great-skills**     | Reference for writing and editing skills well — vocabulary and principles for predictability  |

## How `.claude/` and `.agents/` relate

Skills are no longer duplicated. `.agents/skills/` is the single source; the
`.claude/skills` symlink points at it. The only things unique to `.claude/` are
Claude-specific assets that have no generic equivalent:

| Asset       | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `CLAUDE.md` | One-line `@~/.agents/AGENTS.md` import — same conventions        |
| `rules/`    | Path-glob auto-loaded conventions (generic harnesses use skills) |
| `agents/`   | Custom sub-agent definitions spawned via the Task tool           |
| `scripts/`  | Statusline and session-cost helpers                              |

Inside skill bodies, harness-agnostic language is the default. Optional
Claude-only behavior (agent teams, `allowed-tools`/`argument-hint` frontmatter)
is additive — other harnesses ignore what they don't understand.

### Claude-specific frontmatter

Skill bodies are harness-agnostic, but some YAML frontmatter keys are read only
by Claude Code. They're safe to leave in shared skills — other harnesses ignore
unknown keys.

| Field                      | Where        | Purpose                                                             |
| -------------------------- | ------------ | ------------------------------------------------------------------- |
| `user-invocable`           | `SKILL.md`   | Exposes the skill as a `/skill-name` slash command                  |
| `argument-hint`            | `SKILL.md`   | Placeholder text shown after the slash command in the prompt        |
| `allowed-tools`            | `SKILL.md`   | Pre-approves specific tool calls (e.g. `Bash(git diff:*)`)          |
| `disable-model-invocation` | `SKILL.md`   | Prevents the model from auto-invoking; user must call it explicitly |
| `arguments`                | `SKILL.md`   | Structured argument definitions for a slash command                 |
| `paths`                    | `rules/*.md` | Glob patterns that auto-load a rule when matching files are touched |

### Generating rules from skills

`.claude/rules/go.md` and `.claude/rules/markdown.md` are **generated** from
`go-conventions` and `markdown-conventions` skills — the skill `SKILL.md` is the
single source of truth, and the rule differs only by frontmatter (`paths:` globs
in place of `name:`/`description:`). Bodies stay byte-identical.

Regenerate with `make rules` (runs `.claude/scripts/gen-rules.sh`). `make install` runs it automatically. After editing a `*-conventions` skill, run `make rules` before committing, since the generated rules are committed.

## Workflow

- research-plan → critique → next-task → commit → code-review → cleanup →
  refactor → redesign

## Contributing

When adding to this repository:

1. Ensure additions are truly **global** and applicable across multiple projects
1. Write clear, concise descriptions to ensure accurate interpretation
1. Include examples where helpful
1. Avoid project-specific details or configurations
1. Add new skills under `.agents/skills/<name>/` only — the `.claude/skills`
   symlink picks them up automatically. Keep content harness-agnostic; put any
   Claude-only guidance in an optional "Agent teams (if your harness supports
   it)" section
1. Test with Claude to ensure the desired behavior

## License

This repository contains personal coding skills and preferences. Feel free to
use and adapt these skills for your own projects.
