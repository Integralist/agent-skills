#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Define portable Unicode icons (UTF-8 hex)
icon_git=$(printf '\xEE\x9C\x82')
icon_tag=$(printf '\xEF\x80\xAB')
icon_go=$(printf '\xEE\x99\x9E')
icon_node=$(printf '\xEE\xB4\x8D')
icon_rust=$(printf '\xEE\x9E\xA8')

# Extract information from JSON
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
output_style=$(echo "$input" | jq -r '.output_style.name // empty')

# Model name - extract display name or fall back to ID
model_name=$(echo "$input" | jq -r '.model.display_name // .model.id // "Gemini"')

# Effort level (absent when the model doesn't support it)
effort_level=$(echo "${input}" | jq -r '.effort.level // empty')

# Treat the built-in "default" output style as empty so it doesn't clutter the suffix.
style_label=""
if [[ "${output_style}" != "default" && -n "${output_style}" && "${output_style}" != "null" ]]; then
    style_label="${output_style}"
fi

if [[ -n "${effort_level}" && -n "${style_label}" ]]; then
    model_suffix="${effort_level} · ${style_label}"
elif [[ -n "${effort_level}" ]]; then
    model_suffix="${effort_level}"
else
    model_suffix="${style_label}"
fi

if [[ -n "${model_suffix}" ]]; then
    model_display="${model_name} (${model_suffix})"
else
    model_display="${model_name}"
fi

# Get current directory basename
dir_name=$(basename "$current_dir")

# Context window usage percentage (using native field or fallback computation)
pct=$(echo "${input}" | jq -r '.context_window.used_percentage // empty')
if [[ -n "${pct}" && "${pct}" != "null" ]]; then
    pct=$(echo "${pct}" | cut -d. -f1)
else
    # Fallback computation
    usage=$(echo "${input}" | jq '.context_window.current_usage // empty')
    if [[ -n "${usage}" && "${usage}" != "null" ]]; then
        current=$(echo "${usage}" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
        size=$(echo "${input}" | jq '.context_window.context_window_size')
        if [[ -n "${size}" && "${size}" != "0" ]]; then
            pct=$((current * 100 / size))
        fi
    fi
fi

# Get VCS/git information (using native payload or fallback execution)
vcs_branch=$(echo "${input}" | jq -r '.vcs.branch // empty')
vcs_dirty=$(echo "${input}" | jq -r '.vcs.dirty // empty')

git_info=""
if [[ -n "${vcs_branch}" && "${vcs_branch}" != "null" ]]; then
    git_status=""
    if [[ "${vcs_dirty}" == "true" ]]; then
        git_status=" *"
    fi
    git_info=" │ $icon_git $vcs_branch$git_status"
else
    # Fallback to direct git command
    if git rev-parse --git-dir > /dev/null 2>&1; then
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        git_status=""
        if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
            git_status=" *"
        fi
        commit_hash=$(git rev-parse --short HEAD 2>/dev/null)
        git_tag=$(git tag --points-at HEAD 2>/dev/null | head -n 1)
        tag_info=""
        if [[ -n "$git_tag" ]]; then
            if (( ${#git_tag} > 12 )); then
                git_tag="${git_tag:0:12}…"
            fi
            tag_info=" $icon_tag $git_tag"
        fi
        git_info=" │ $icon_git $branch$git_status ($commit_hash)$tag_info"
    fi
fi

# Get language environment info (Go, Node, Rust)
lang_info=""
if [[ -n "${current_dir}" ]]; then
    if [[ -f "$current_dir/go.mod" ]]; then
        go_version=$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')
        lang_info=" │ $icon_go $go_version"
    elif [[ -f "$current_dir/package.json" ]]; then
        node_version=$(node --version 2>/dev/null | sed 's/v//')
        lang_info=" │ $icon_node $node_version"
    elif [[ -f "$current_dir/Cargo.toml" ]]; then
        rust_version=$(rustc --version 2>/dev/null | awk '{print $2}')
        lang_info=" │ $icon_rust $rust_version"
    fi
fi

# Get AWS SSO session expiry
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

# Session cost
cost_info=""
total_cost=$(echo "${input}" | jq -r '.cost.total_cost_usd // empty')
if [[ -n "${total_cost}" && "${total_cost}" != "null" ]]; then
    cost_info=$(printf " │ \$%.2f" "${total_cost}")
fi

# Layout adaptive rendering based on terminal_width
term_width=$(echo "${input}" | jq -r '.terminal_width // empty')
show_context=true
show_lang=true
show_aws=true

if [[ -n "${term_width}" && "${term_width}" != "null" ]]; then
    if (( term_width < 110 )); then
        show_aws=false
    fi
    if (( term_width < 90 )); then
        show_lang=false
    fi
    if (( term_width < 70 )); then
        show_context=false
    fi
fi

# Build Context Progress Bar if shown
context_info=""
if [[ "${show_context}" == "true" && -n "${pct}" && "${pct}" != "null" ]]; then
    filled=$((pct / 10))
    empty=$((10 - filled))
    filled_bar=""
    empty_bar=""
    for ((i=0; i<filled; i++)); do filled_bar+="█"; done
    for ((i=0; i<empty; i++)); do empty_bar+="░"; done

    if (( pct >= 70 )); then
        color_start=$'\033[31m'  # red
        color_end=$'\033[0m'
    elif (( pct >= 50 )); then
        color_start=$'\033[33m'  # yellow
        color_end=$'\033[0m'
    else
        color_start=""
        color_end=""
    fi

    context_info=" │ Context: ${color_start}[${filled_bar}${empty_bar}] ${pct}%${color_end}"
fi

# Filter optional modules based on size
output_lang=""
[[ "${show_lang}" == "true" ]] && output_lang="${lang_info}"

output_aws=""
[[ "${show_aws}" == "true" ]] && output_aws="${aws_info}"

# Render final status line
printf "🤖 %s%s%s │ 📁 %s%s%s%s" \
    "$model_display" \
    "${context_info}" \
    "${cost_info}" \
    "$dir_name" \
    "${git_info}" \
    "${output_lang}" \
    "${output_aws}"
