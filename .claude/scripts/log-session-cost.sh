#!/bin/bash
# ~/.claude/scripts/log-session-cost.sh

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')
cwd=$(echo "$input" | jq -r '.cwd')

encoded_cwd=$(echo "$cwd" | sed 's|^/||; s|/|-|g')
transcript_file="$HOME/.claude/projects/-$encoded_cwd/$session_id.jsonl"

if [ -f "$transcript_file" ]; then
  stats=$(jq -s '
    # --- PRICING CONFIGURATION (Per Million Tokens) ---
    {
      price_in: 5.00,
      price_out: 25.00,
      price_read: 0.50,
      price_write: 6.25
    } as $costs |

    # 1. Select entries with usage
    # 2. Group by Message ID to handle duplicate updates for the same turn
    # 3. Take the last update for each ID (deduplication)
    [
      .[] | select(.message.usage)
      | {id: .message.id, usage: .message.usage}
    ]
    | group_by(.id)
    | map(last)
    | {
        input: (map(.usage.input_tokens // 0) | add // 0),
        output: (map(.usage.output_tokens // 0) | add // 0),
        cache_read: (map(.usage.cache_read_input_tokens // 0) | add // 0),
        # For cache creation, we usually want the max per session or sum of unique writes.
        # Deduplicating by message ID usually solves the double-count.
        cache_creation: (map(.usage.cache_creation_input_tokens // 0) | add // 0)
    } |

    # Calculate Total Cost
    .total_cost = (
      (.input * $costs.price_in) +
      (.output * $costs.price_out) +
      (.cache_read * $costs.price_read) +
      (.cache_creation * $costs.price_write)
    ) / 1000000
  ' "$transcript_file")

  # Format output
  cost_val=$(echo "$stats" | jq -r '.total_cost | . * 10000 | round / 10000 | "\(.)"')
  json_stats=$(echo "$stats" | jq -c 'del(.total_cost)')
  formatted_cost=$(printf "%.4f" "$cost_val")

  echo "$(date -Iseconds) session=$session_id total_cost=\$$formatted_cost session_log=~/.claude/debug/$session_id.txt $json_stats" >> "$HOME/.claude/session-costs.log"
fi
