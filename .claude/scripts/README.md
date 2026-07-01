# Claude Code Scripts

Scripts used by Claude Code hooks and status line configuration.

## `log-session-cost.sh`

Logs per-session token usage and cost estimates. Invoked as a hook at session end.

Reads the session transcript JSONL, deduplicates usage entries by message ID,
and calculates cost using hardcoded per-million-token pricing (input, output,
cache read, cache creation). Appends a one-line summary to
`~/.claude/session-costs.log`.

### Querying the cost log

Add this shell function to query daily costs from the log:

```bash
claude_cost() {
    local log_file="$HOME/.claude/session-costs.log"

    if [[ ! -f "$log_file" ]]; then
        echo "Log file not found."
        return 1
    fi

    if [[ "$1" =~ ^-[0-9]+$ ]]; then
        local days=${1#-}
        local dates=()
        for (( i=0; i<days; i++ )); do
            dates+=("$(date -v-${i}d +%F)")
        done
        local pattern="${(j:|:)dates}"

        awk -v date="$pattern" -v days="$days" '
        $0 ~ "^("date")" {
            found = 1
            for (i=1; i<=NF; i++) {
                if ($i ~ /^total_cost=/) {
                    split($i, parts, "=")
                    val = substr(parts[2], 2)
                    sum += val
                }
            }
        }
        END {
            if (found) {
                printf "Total for last %d days: $%.4f\n", days, sum
            } else {
                printf "No entries found for last %d days.\n", days
            }
        }
        ' "$log_file"
    else
        local target_date="${1:-$(date +%F)}"

        awk -v date="$target_date" '
        $0 ~ "^"date {
            found = 1
            for (i=1; i<=NF; i++) {
                if ($i ~ /^total_cost=/) {
                    split($i, parts, "=")
                    val = substr(parts[2], 2)
                    sum += val
                }
            }
        }
        END {
            if (found) {
                printf "Total for %s: $%.4f\n", date, sum
            } else {
                printf "No entries found for %s.\n", date
            }
        }
        ' "$log_file"
    fi
}
```

Usage:

```bash
claude_cost          # today's total
claude_cost 2026-02-22  # specific date
claude_cost -5       # last 5 days combined
```

## `statusline.sh`

Generates the Claude Code status line. Reads a JSON payload from stdin and
displays:

- Model name, effort level, and output style
- Working directory
- Git branch, dirty marker, short commit hash, and — when a tag points at
  `HEAD` — the tag (truncated to 12 chars with `…` when longer than a standard
  `v000.000.000` tag)
- Language runtime version (Go, Node, Rust) based on project files
- AWS SSO session time remaining
- Context window usage as a progress bar
- Session cost

Sibling status line scripts for other harnesses live in the repo root:
`.gemini/antigravity-cli/statusline.sh` (Gemini Antigravity CLI) and
`.copilot/scripts/statusline.sh` (Copilot CLI). All three render the same
information, adapted to each harness's JSON payload. Install them with
`make install-gemini` and `make install-copilot` (both no-op when the target
directory is absent).

### Configuration

Claude Code invokes the status line via the `statusLine` block in
`~/.claude/settings.json`. A representative skeleton (secrets and the AWS
account ID redacted):

```json
{
  "awsAuthRefresh": "aws sso login --profile bedrock",
  "env": {
    "AWS_PROFILE": "bedrock",
    "AWS_REGION": "us-east-2",
    "CLAUDE_CODE_USE_BEDROCK": "1"
  },
  "model": "arn:aws:bedrock:us-east-2:<ACCOUNT_ID>:inference-profile/global.anthropic.claude-opus-4-8",
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/scripts/log-session-cost.sh"
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/scripts/statusline.sh"
  },
  "effortLevel": "high",
  "theme": "dark-ansi"
}
```
