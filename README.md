# Agent Skills Configuration

This repository contains **global agent configuration** — skills, agents, rules,
and project instructions designed to be used across all projects when working
with AI coding assistants.

It serves two targets:

- **Claude Code** — reads `.claude/` (skills, agents, rules, CLAUDE.md)
- **Generic Agent Skills** (e.g. Swival) — reads `.agents/` (skills, AGENTS.md)

Skills exist in both locations. The `.claude/` versions use Claude-specific
primitives (TeamCreate, SendMessage, allowed-tools). The `.agents/` versions use
platform-agnostic language (subagents, role descriptions) so any compatible CLI
can use them.

## Install

```bash
# Claude Code only
make install-claude

# Generic agents only (e.g. Swival)
make install-agents

# Both
make install
```

## Structure

```plain
.claude/                            # Claude Code (primary)
├── CLAUDE.md                       # Global project instructions
├── agents/
│   └── code-improvement-reviewer.md
├── rules/
│   ├── go.md                       # Go conventions (auto-loaded for *.go)
│   └── markdown.md                 # Markdown conventions (auto-loaded for *.md)
└── skills/
    ├── brevity/
    ├── cleanup/
    ├── code-review/
    ├── commit/
    ├── critique/
    ├── delegate/
    ├── go-api/
    ├── go-testing/
    ├── grepai/
    ├── improve-docs/
    ├── markdown-to-skill/          # Claude-only (not in .agents/)
    ├── next-task/
    ├── refactor/
    ├── research-plan/
    ├── systematic-debugging/
    └── test-feedback/

.agents/                            # Generic Agent Skills
├── AGENTS.md                       # Shared conventions
└── skills/
    ├── brevity/
    ├── cleanup/                    # Rewritten: teams → subagents
    ├── code-review/                # Rewritten: teams → subagents
    ├── commit/                     # Minor phrasing tweaks
    ├── critique/
    ├── delegate/                   # Rewritten: generic roles
    ├── go-api/
    ├── go-conventions/             # New: rule → skill
    ├── go-testing/
    ├── grepai/
    ├── improve-docs/
    ├── markdown-conventions/       # New: rule → skill
    ├── next-task/                  # Rewritten: teams → subagents
    ├── refactor/                   # Rewritten: teams → subagents
    ├── research-plan/              # Rewritten: teams → subagents
    ├── systematic-debugging/
    └── test-feedback/              # Minor phrasing tweaks
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

- `.claude/CLAUDE.md` — Claude Code global instructions
- `.agents/AGENTS.md` — Generic agent global conventions

## Skill Reference

| Skill | Description |
| --- | --- |
| **brevity** | Ultra-compressed communication with 3 intensity levels |
| **cleanup** | Audit codebase for AI slop via background subagent |
| **code-review** | Multi-dimensional review via parallel subagents |
| **commit** | Git commits with intelligent file grouping |
| **critique** | Critique a document for logical fallacies |
| **delegate** | Spawn a subagent for a task |
| **go-api** | Generate a production-ready Go API service |
| **go-conventions** | Go coding conventions (.agents/ only) |
| **go-testing** | Write Go tests — table-driven, fuzz, benchmarks |
| **grepai** | Semantic code search by intent |
| **improve-docs** | Improve technical document writing via five documentation pillars |
| **markdown-conventions** | Markdown formatting conventions (.agents/ only) |
| **markdown-to-skill** | Bulk-convert Markdown to skills (.claude/ only) |
| **next-task** | Continue working through a project plan |
| **refactor** | Analyze a feature and produce a reimplementation plan |
| **research-plan** | Research topics deeply, then create implementation plans |
| **systematic-debugging** | Four-phase debugging with root cause analysis |
| **test-feedback** | Parse test failures and fix them in a background subagent |

## Differences Between .claude/ and .agents/

| Aspect | `.claude/` | `.agents/` |
| --- | --- | --- |
| Orchestration | TeamCreate, SendMessage, TaskCreate | "Spawn a subagent" with role descriptions |
| Rules | Auto-loaded by file path glob | Converted to explicit skills |
| Prompting | AskUserQuestion with options | "Present numbered options and wait" |
| Frontmatter | user-invocable, argument-hint, allowed-tools | name, description only |
| markdown-to-skill | Included | Omitted (uses Claude-only features) |
| code-review dimensions | 6 (consistency, Go, data, security, arch, docs) | 4 (consistency, data, security, Go) |

## Workflow

- research-plan → critique → next-task → commit → code-review → cleanup →
  refactor

## Contributing

When adding to this repository:

1. Ensure additions are truly **global** and applicable across multiple projects
1. Write clear, concise descriptions to ensure accurate interpretation
1. Include examples where helpful
1. Avoid project-specific details or configurations
1. Create both `.claude/` and `.agents/` versions for new skills
1. Test with Claude to ensure the desired behavior

## License

This repository contains personal coding skills and preferences. Feel free to
use and adapt these skills for your own projects.

## Notes

I have a global gitignore that prevents `.claude/` from being committed. So I
have to `git add -f .claude/` every time I make a change.
