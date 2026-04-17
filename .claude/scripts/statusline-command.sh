#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract information from JSON
current_dir=$(echo "$input" | jq -r '.workspace.current_dir')
output_style=$(echo "$input" | jq -r '.output_style.name')
# model_name=$(echo "$input" | jq -r '.model.display_name')

# Model name - extract friendly name from ARN or model ID
model_id=$(echo "${input}" | jq -r '.model.id')
if [[ "${model_id}" =~ (opus|sonnet|haiku)-([0-9]+)-?([0-9]+)? ]]; then
    family="${BASH_REMATCH[1]^}"
    major="${BASH_REMATCH[2]}"
    minor="${BASH_REMATCH[3]}"
    if [[ -n "${minor}" ]]; then
        model_name="${family} ${major}.${minor}"
    else
        model_name="${family} ${major}"
    fi
else
    model_name=$(echo "${input}" | jq -r '.model.display_name')
fi

# Get current time
current_time=$(date +%H:%M:%S)

# Get current directory basename
dir_name=$(basename "$current_dir")

# Get git information if in a git repo
if git rev-parse --git-dir > /dev/null 2>&1; then
    # Get branch name
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

    # Get git status
    git_status=""
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        git_status=" *"
    fi

    # Get commit hash (short)
    commit_hash=$(git rev-parse --short HEAD 2>/dev/null)

    git_info=" │ "$'\ue702'" $branch$git_status ($commit_hash)"
else
    git_info=""
fi

# Get Go version if go.mod exists
# Uses Nerd Fonts private-use Unicode glyphs (see: https://www.nerdfonts.com/cheat-sheet)
if [[ -f "$current_dir/go.mod" ]]; then
    go_version=$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')
    lang_info=" │ "$'\ue65e'" $go_version"
elif [[ -f "$current_dir/package.json" ]]; then
    node_version=$(node --version 2>/dev/null | sed 's/v//')
    lang_info=" │ "$'\ued0d'" $node_version"
elif [[ -f "$current_dir/Cargo.toml" ]]; then
    rust_version=$(rustc --version 2>/dev/null | awk '{print $2}')
    lang_info=" │ "$'\ue7a8'" $rust_version"
else
    lang_info=""
fi

# Get AWS SSO session expiry ☁️
aws_info=""
sso_cache_dir="$HOME/.aws/sso/cache"
if [ -d "$sso_cache_dir" ]; then
    latest_cache_file=$(find "$sso_cache_dir" -name '*.json' -print0 2>/dev/null | xargs -0 ls -t | head -n 1)

    if [ -n "$latest_cache_file" ]; then
        expires_at=$(jq -r '.expiresAt' "$latest_cache_file")

        if [[ "$expires_at" != "null" && -n "$expires_at" ]]; then
            expiration_epoch=""
            if [[ "$(uname -s)" == "Darwin" ]]; then
								clean_expires_at="${expires_at%%.*}"
								expiration_epoch=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$clean_expires_at" "+%s" 2>/dev/null)
            else
                # GNU/Linux `date` handles milliseconds gracefully
                expiration_epoch=$(date -d "$expires_at" +%s 2>/dev/null)
            fi

            current_epoch=$(date +%s)

            if [ -n "$expiration_epoch" ]; then
                seconds_left=$((expiration_epoch - current_epoch))

                if [ "$seconds_left" -gt 0 ]; then
                    hours=$((seconds_left / 3600))
                    minutes=$(((seconds_left % 3600) / 60))
                    seconds=$((seconds_left % 60))
                    time_left=$(printf "%02d:%02d:%02d" $hours $minutes $seconds)
                    aws_info=" │ ☁️ $time_left"
                else
                    aws_info=" │ ☁️ Expired"
                fi
            fi
        fi
    fi
fi

# Context usage with progress bar
context_info=""
usage=$(echo "${input}" | jq '.context_window.current_usage')
if [[ "${usage}" != "null" ]]; then
    current=$(echo "${usage}" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
    size=$(echo "${input}" | jq '.context_window.context_window_size')
    pct=$((current * 100 / size))

    filled=$((pct / 10))
    empty=$((10 - filled))
    filled_bar=""
    empty_bar=""
    for ((i=0; i<filled; i++)); do filled_bar+="█"; done
    for ((i=0; i<empty; i++)); do empty_bar+="░"; done

    context_info=" │ Context: [${filled_bar}${empty_bar}] ${pct}%"
fi

# Session cost
cost_info=""
total_cost=$(echo "${input}" | jq -r '.cost.total_cost_usd // empty')
if [[ -n "${total_cost}" ]]; then
    cost_info=$(printf " │ \$%.2f" "${total_cost}")
fi

# Build the status line, now including the AWS session info
# Uses Nerd Fonts private-use Unicode glyphs (see: https://www.nerdfonts.com/cheat-sheet)
printf "⏰ %s │ 📁 %s%s%s%s │ 🤖 %s (%s)%s%s" \
    "$current_time" \
    "$dir_name" \
    "$git_info" \
    "$lang_info" \
    "$aws_info" \
    "$model_name" \
    "$output_style" \
    "${context_info}" \
    "${cost_info}" \
