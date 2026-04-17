# Claude Code Scripts

Scripts used by Claude Code hooks and status line configuration.

## `log-session-cost.sh`

Logs per-session token usage and cost estimates. Invoked as a hook at session end.

Reads the session transcript JSONL, deduplicates usage entries by message ID, and calculates cost using hardcoded per-million-token pricing (input, output, cache read, cache creation). Appends a one-line summary to `~/.claude/session-costs.log`.

## `statusline-command.sh`

Generates the Claude Code status line. Reads a JSON payload from stdin and displays:

- Current time
- Working directory and git branch/status/commit
- Language runtime version (Go, Node, Rust) based on project files
- AWS SSO session time remaining
- Model name and output style
- Context window usage as a progress bar
- Session cost
