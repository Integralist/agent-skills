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

## `statusline-command.sh`

Generates the Claude Code status line. Reads a JSON payload from stdin and displays:

- Current time
- Working directory and git branch/status/commit
- Language runtime version (Go, Node, Rust) based on project files
- AWS SSO session time remaining
- Model name and output style
- Context window usage as a progress bar
- Session cost
