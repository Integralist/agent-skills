# Claude Code Configuration

This repository contains my **global Claude Code configuration** — skills,
agents, and project instructions designed to be used across all projects when
working with Claude AI.

## Components

### Skills (`skills/`)

[Claude Code Skills](https://code.claude.com/docs/en/skills) are custom code
capabilities that extend Claude's ability to perform specific tasks, follow
particular patterns, or apply specialized knowledge. Skills act as reusable
instructions invoked with `/skill-name`.

Skills can include:

- **Coding conventions** and style preferences
- **Architecture patterns** and best practices
- **Testing strategies** and patterns
- **Framework-specific** patterns and idioms
- **Domain-specific** knowledge and approaches

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

Current rules:

- **go.md** — Go coding conventions: struct layout, error handling, logging,
  observability, testing, and layer separation. Scoped to `**/*.go`.
- **markdown.md** — Markdown formatting, code blocks, and inclusive language
  linting. Scoped to `**/*.md`.

### Project Instructions (`.claude/CLAUDE.md`)

The [CLAUDE.md file](https://code.claude.com/docs/en/memory#claudemd) defines
working relationship preferences and tooling guidelines that apply globally.
This includes:

- Communication style (concise, no sycophancy)
- Tooling preferences (prefer Makefile targets, use Edit over sed)
- Collaboration norms (challenge assumptions, do things right)

## Global Configuration

Everything in this repository is intended to be **global** — applying across all
projects rather than being specific to a single codebase. These are universal
patterns, conventions, and preferences I want Claude to follow consistently.

## Structure

```plain
.claude/
├── CLAUDE.md           # Global project instructions
├── agents/
│   └── *.md            # Custom agent definitions
├── rules/
│   ├── go.md           # Go conventions
│   └── markdown.md     # Markdown linting
└── skills/
    ├── cleanup/
    ├── code-research/
    ├── code-review/
    ├── commit/
    ├── critique/
    ├── delegate/
    ├── go-api/
    ├── go-testing/
    ├── grepai/
    ├── markdown-to-skill/
    ├── next-task/
    ├── refactor/
    ├── research-plan/
    ├── systematic-debugging/
    └── test-feedback/
```

### Skill Reference

| Skill                    | Invocation                                                 | Description                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **cleanup**              | `/cleanup [path \| glob]`                                  | Audit a codebase for AI slop. Fixes obvious issues directly and flags anything that would change behavior. Runs as a background agent.                                      |
| **code-research**        | `/code-research <repo-name \| github-url>`                 | Locate and explore a repository by name or GitHub URL. Finds it locally under `~/code` or clones it with `gh`.                                                              |
| **code-review**          | `/code-review [PR_URL \| --diff \| --uncommitted \| path]` | Review code using five specialized agents working in parallel, each focused on a different dimension (consistency, idiomatic Go, data correctness, security, architecture). |
| **commit**               | `/commit`                                                  | Create git commits with intelligent file grouping based on staged/unstaged changes.                                                                                         |
| **critique**             | `/critique`                                                | Critique a document for logical fallacies and structural weaknesses. Every issue includes a recommended fix.                                                                |
| **delegate**             | `/delegate <task>`                                         | Spawn a named agent on a team to handle work in a parallel thread, preserving top-level context.                                                                            |
| **go-api**               | `/go-api`                                                  | Generate a complete production-ready Go API service with boilerplate, local development setup, and observability.                                                           |
| **go-testing**           | `/go-testing`                                              | Write unit and integration tests for Go services — table-driven tests, mocks, fuzz tests, and benchmarks.                                                                   |
| **grepai**               | `/grepai`                                                  | Semantic code search by intent or concept (e.g. "where is rate limiting implemented") when exact names are unknown.                                                         |
| **markdown-to-skill**    | `/markdown-to-skill`                                       | Bulk-convert Markdown files from a directory into valid Claude Code Skills.                                                                                                 |
| **next-task**            | `/next-task [--skip-agents]`                               | Find the next unchecked task in a project plan and begin implementation. Delegates to an agent by default.                                                                  |
| **refactor**             | `/refactor <feature or area>`                              | Analyze an existing feature and produce a reimplementation plan focused on reducing complexity and fragmentation.                                                           |
| **research-plan**        | `/research-plan`                                           | Two-phase workflow: research topics deeply to produce reference docs, then create precise implementation plans.                                                             |
| **systematic-debugging** | `/systematic-debugging`                                    | Four-phase debugging methodology emphasizing root cause analysis before any fix is attempted.                                                                               |
| **test-feedback**        | `/test-feedback`                                           | Parse test failure output and spawn a background agent to fix the failing tests.                                                                                            |

> [!NOTE]
> If you need to generate Markdown files for the `markdown-to-skill` Skill, then
> you can use [`rodydavis/agent-skills-generator`][agent-skills-generator].

```shell
git clone https://github.com/rodydavis/agent-skills-generator.git

cd agent-skills-generator

cat <<EOF > .skillcontext
https://www.fastly.com/documentation/developers/*
https://docs.fastly.com/*
EOF

go run main.go crawl
```

## Workflow

I have the following workflow (you can skip items if they're not necessary):

- code-research (creates `docs/research/{repo}.md` documents)
- research-plan (creates `docs/research/{topic}.md` + `docs/plans/{project}.md` documents)
- critique (reviews plans and highlights issues)
- next-task (finds latest plan and starts next task)
- commit (commit code changes; or you can do at the end)
- code-review (reviews implementation code)
- cleanup (cleans up obvious AI code; like verbose code comments)
- refactor (redesigns a code feature)

## Contributing

When adding to this repository:

1. Ensure additions are truly **global** and applicable across multiple projects
1. Write clear, concise descriptions to ensure Claude interprets them accurately.
1. Include examples where helpful
1. Avoid project-specific details or configurations
1. Test with Claude to ensure the desired behavior

## License

This repository contains personal coding skills and preferences. Feel free to
use and adapt these skills for your own projects.

## Notes

I have a global gitignore that prevents `.claude/` from being committed. So I
have to `git add -f .claude/` every time I make a change.

[agent-skills-generator]: https://github.com/rodydavis/agent-skills-generator
