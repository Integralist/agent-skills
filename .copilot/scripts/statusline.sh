#!/usr/bin/env bash

input=$(cat)

json_first() {
  command -v jq >/dev/null 2>&1 || return 1

  local query value
  for query in "$@"; do
    value=$(jq -r "${query} // empty" <<<"${input}" 2>/dev/null)
    if [[ -n "${value}" && "${value}" != "null" ]]; then
      printf "%s" "${value}"
      return 0
    fi
  done

  return 1
}

friendly_model_name() {
  local model_id="${1:-}"
  local display_name="${2:-}"

  if [[ "${model_id}" =~ (opus|sonnet|haiku)[-_]?([0-9]+)([.-]?([0-9]+))? ]]; then
    local family="${BASH_REMATCH[1]^}"
    local major="${BASH_REMATCH[2]}"
    local minor="${BASH_REMATCH[4]}"
    if [[ -n "${minor}" ]]; then
      printf "%s %s.%s" "${family}" "${major}" "${minor}"
    else
      printf "%s %s" "${family}" "${major}"
    fi
  elif [[ "${model_id}" =~ gpt[-_]?([0-9]+([.][0-9]+)?)([-_]?(mini|codex))? ]]; then
    local version="${BASH_REMATCH[1]}"
    local variant="${BASH_REMATCH[4]}"
    if [[ -n "${variant}" ]]; then
      printf "GPT-%s %s" "${version}" "${variant}"
    else
      printf "GPT-%s" "${version}"
    fi
  elif [[ -n "${display_name}" ]]; then
    printf "%s" "${display_name}"
  elif [[ -n "${model_id}" ]]; then
    printf "%s" "${model_id}"
  else
    printf "Copilot"
  fi
}

find_up() {
  local dir="$1"
  local file="$2"

  while [[ -n "${dir}" && "${dir}" != "/" ]]; do
    if [[ -f "${dir}/${file}" ]]; then
      printf "%s/%s" "${dir}" "${file}"
      return 0
    fi
    dir=$(dirname "${dir}")
  done

  return 1
}

parent_start_nano() {
  local start epoch

  start=$(ps -o lstart= -p "${PPID}" 2>/dev/null | sed 's/^ *//')
  [[ -z "${start}" ]] && return 1

  if [[ "$(uname -s)" == "Darwin" ]]; then
    epoch=$(date -j -f "%a %b %d %T %Y" "${start}" "+%s" 2>/dev/null)
  else
    epoch=$(date -d "${start}" "+%s" 2>/dev/null)
  fi

  [[ -n "${epoch}" ]] && printf "%s000000000" "${epoch}"
}

model_pricing_rates() {
  local model_id lower

  model_id="${1:-}"
  lower=$(printf "%s" "${model_id}" | tr '[:upper:]' '[:lower:]')

  # USD per 1M tokens: input, cached input, output, cache write.
  case "${lower}" in
    *gpt*5.5*) printf "5 0.5 30 0" ;;
    *gpt*5.4*mini*) printf "0.75 0.075 4.5 0" ;;
    *gpt*5.4*nano*) printf "0.20 0.02 1.25 0" ;;
    *gpt*5.4*) printf "2.5 0.25 15 0" ;;
    *gpt*5.3*codex* | *gpt*5.2*codex*) printf "1.75 0.175 14 0" ;;
    *gpt*5.2*) printf "1.75 0.175 14 0" ;;
    *gpt*5*mini*) printf "0.25 0.025 2 0" ;;
    *gpt*4.1*) printf "2 0.5 8 0" ;;
    *claude*haiku*4.5*) printf "1 0.1 5 1.25" ;;
    *claude*sonnet*4* | *sonnet*4*) printf "3 0.3 15 3.75" ;;
    *claude*opus*4* | *opus*4*) printf "5 0.5 25 6.25" ;;
    *gemini*3.5*flash*) printf "1.5 0.15 9 0" ;;
    *gemini*3*flash*) printf "0.5 0.05 3 0" ;;
    *gemini*3.1*pro*) printf "2 0.2 12 0" ;;
    *gemini*2.5*pro*) printf "1.25 0.125 10 0" ;;
    *mai*code*1*flash*) printf "0.75 0.075 4.5 0" ;;
    *raptor*mini*) printf "0.25 0.025 2 0" ;;
    *) return 1 ;;
  esac
}

format_usd() {
  awk -v cost="${1:-0}" 'BEGIN {
    if (cost < 0.005) {
      printf "$%.4f", cost
    } else {
      printf "$%.2f", cost
    }
  }'
}

otel_cost_usd() {
  command -v jq >/dev/null 2>&1 || return 1

  local session_id="$1"
  local model_id="$2"
  local otel_file="${COPILOT_OTEL_FILE_EXPORTER_PATH:-}"
  local min_nano lines summary aiu_value exact_cost input_tokens cached_tokens output_tokens cache_write_tokens
  local input_rate cached_rate output_rate cache_write_rate estimated_cost

  if [[ -z "${otel_file}" ]]; then
    otel_file=$(find "${HOME}/.copilot/otel" -name '*.jsonl' -type f -print0 2>/dev/null |
      xargs -0 ls -t 2>/dev/null |
      head -n 1)
  fi

  [[ -n "${otel_file}" && -f "${otel_file}" ]] || return 1

  min_nano=$(parent_start_nano || true)
  lines="${COPILOT_STATUSLINE_OTEL_LINES:-5000}"

  summary=$(tail -n "${lines}" "${otel_file}" 2>/dev/null | jq -s -r \
    --arg session_id "${session_id}" \
    --arg min_nano "${min_nano}" '
      def attr_value:
        if type != "object" then .
        elif has("stringValue") then .stringValue
        elif has("intValue") then (.intValue | tonumber?)
        elif has("doubleValue") then (.doubleValue | tonumber?)
        elif has("boolValue") then .boolValue
        elif has("value") then (.value | attr_value)
        else empty
        end;

      def attrs:
        if (.attributes? | type) == "array" then
          [.attributes[]? | select(type == "object" and has("key") and has("value")) | {key: (.key | tostring), value: (.value | attr_value)}]
        elif (.attributes? | type) == "object" then
          [.attributes | to_entries[] | {key: (.key | tostring), value: .value}]
        else
          []
        end;

      def key_matches($re): (.key | test($re; "i"));

      def has_session($sid):
        ($sid == "") or (attrs | any(key_matches("session") and ((.value | tostring) == $sid)));

      def span_time:
        if (.startTime? | type) == "array" then
          ((.startTime[0] | tonumber) * 1000000000) + (.startTime[1] | tonumber)
        else
          (.startTimeUnixNano? // .start_time_unix_nano? // .start_time_unix_nanos? // empty) | tonumber?
        end;

      def after_min($min):
        ($min == "") or ((span_time // 0) == 0) or ((span_time // 0) >= ($min | tonumber));

      def span_kind:
        attrs as $attrs |
        if (((.name? // "") | tostring | test("^chat\\b"; "i")) or ($attrs | any(.key == "gen_ai.operation.name" and (.value | tostring) == "chat"))) then
          "chat"
        elif (((.name? // "") | tostring | test("^invoke_agent$"; "i")) or ($attrs | any(.key == "gen_ai.operation.name" and (.value | tostring) == "invoke_agent"))) then
          "invoke_agent"
        else
          ""
        end;

      def span_aiu:
        attrs as $attrs |
        [$attrs[] | select(key_matches("(^|[.])aiu$")) | (.value | tonumber?)] | add // 0;

      def span_cost_usd:
        attrs as $attrs |
        ([$attrs[] | select(key_matches("credit") and (key_matches("limit|remaining|budget") | not)) | ((.value | tonumber?) * 0.01)] | add // 0) as $credit_usd |
        ([$attrs[] | select(key_matches("(cost_usd|usd_cost|price_usd|dollar)")) | (.value | tonumber?)] | add // 0) as $usd |
        if $usd > 0 then $usd elif $credit_usd > 0 then $credit_usd else 0 end;

      def token_sum($include; $exclude):
        [attrs[] |
          select(key_matches($include) and key_matches("token") and
            (if $exclude == "" then true else (key_matches($exclude) | not) end)) |
          (.value | tonumber?)] | add // 0;

      def span_tokens:
        {
          input: token_sum("(input|prompt)"; "cached|cache|output|completion|response"),
          cached: token_sum("(cached|cache_read)"; "write"),
          output: token_sum("(output|completion|response)"; ""),
          cache_write: token_sum("(cache_write|write)"; "")
        };

      def session_matches($sid):
        ($sid == "") or (attrs | any(key_matches("session|conversation") and ((.value | tostring) == $sid)));

      [
        .. | objects |
        select(has("attributes") and (has("name") or has("spanId") or has("span_id") or has("startTimeUnixNano") or has("start_time_unix_nano"))) |
        span_kind as $kind |
        select($kind != "") |
        {kind: $kind, after_min: after_min($min_nano), session_match: session_matches($session_id), aiu: span_aiu, cost: span_cost_usd, tokens: span_tokens}
      ] as $raw_candidates |
      (if ([$raw_candidates[] | select(.after_min)] | length) > 0 then
        [$raw_candidates[] | select(.after_min)]
      else
        $raw_candidates
      end) as $candidates |
      (if ([$candidates[] | select(.session_match)] | length) > 0 then
        [$candidates[] | select(.session_match)]
      else
        $candidates
      end) as $session_candidates |
      (if ([$session_candidates[] | select(.kind == "chat")] | length) > 0 then
        [$session_candidates[] | select(.kind == "chat")]
      else
        [$session_candidates[] | select(.kind == "invoke_agent")]
      end) as $spans |
      {
        aiu: ($spans | map(.aiu) | add // 0),
        cost: ($spans | map(.cost) | add // 0),
        input: ($spans | map(.tokens.input) | add // 0),
        cached: ($spans | map(.tokens.cached) | add // 0),
        output: ($spans | map(.tokens.output) | add // 0),
        cache_write: ($spans | map(.tokens.cache_write) | add // 0)
      } |
      [.aiu, .cost, .input, .cached, .output, .cache_write] | @tsv
    ' 2>/dev/null)

  [[ -n "${summary}" ]] || return 1

  IFS=$'\t' read -r aiu_value exact_cost input_tokens cached_tokens output_tokens cache_write_tokens <<<"${summary}"

  if awk -v aiu="${aiu_value:-0}" 'BEGIN { exit !(aiu > 0) }'; then
    awk -v aiu="${aiu_value}" 'BEGIN { printf "%.8f", aiu / 100000000000 }'
    return 0
  fi

  if awk -v cost="${exact_cost:-0}" 'BEGIN { exit !(cost > 0) }'; then
    printf "%s" "${exact_cost}"
    return 0
  fi

  if model_pricing_rates "${model_id}" >/dev/null; then
    read -r input_rate cached_rate output_rate cache_write_rate <<<"$(model_pricing_rates "${model_id}")"
    estimated_cost=$(awk \
      -v input="${input_tokens:-0}" \
      -v cached="${cached_tokens:-0}" \
      -v output="${output_tokens:-0}" \
      -v cache_write="${cache_write_tokens:-0}" \
      -v input_rate="${input_rate}" \
      -v cached_rate="${cached_rate}" \
      -v output_rate="${output_rate}" \
      -v cache_write_rate="${cache_write_rate}" \
      'BEGIN {
        cost = ((input * input_rate) + (cached * cached_rate) + (output * output_rate) + (cache_write * cache_write_rate)) / 1000000
        if (cost > 0) printf "%.8f", cost
      }')

    [[ -n "${estimated_cost}" ]] && printf "%s" "${estimated_cost}"
  fi
}

current_dir=$(json_first \
  '.workspace.current_dir' \
  '.workspace.cwd' \
  '.cwd' \
  '.current_dir' \
  '.currentDirectory' \
  '.directory' \
  '.workspace.root')
current_dir="${current_dir:-$PWD}"

model_id=$(json_first \
  '.model.id' \
  '.model.modelId' \
  '.model_id' \
  '.modelId' \
  '(.model | strings)')
model_display_name=$(json_first \
  '.model.display_name' \
  '.model.displayName' \
  '.model.name' \
  '.model.label')
model_name=$(friendly_model_name "${model_id}" "${model_display_name}")

effort_level=$(json_first \
  '.effort.level' \
  '.model.effortLevel' \
  '.model.effort.level' \
  '.effortLevel' \
  '.reasoning.effort' \
  '.reasoning_effort' \
  '.reasoningEffort')
if [[ -z "${effort_level}" && -f "${HOME}/.copilot/settings.json" ]] && command -v jq >/dev/null 2>&1; then
  effort_level=$(jq -r '.effortLevel // empty' "${HOME}/.copilot/settings.json" 2>/dev/null)
fi

agent_name=$(json_first \
  '.agent.name' \
  '.agent.displayName' \
  '.agent.display_name' \
  '.agentName' \
  '.agent')

session_id=$(json_first \
  '.session.id' \
  '.session.session_id' \
  '.session.sessionId' \
  '.session_id' \
  '.sessionId' \
  '.conversation.id' \
  '.conversationId')

model_display="${model_name}"
if [[ -n "${effort_level}" ]]; then
  model_display+=" (${effort_level})"
fi
if [[ -n "${agent_name}" ]]; then
  model_display+=" · ${agent_name}"
fi

dir_name=$(basename "${current_dir}")

git_info=""
if git -C "${current_dir}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "${current_dir}" rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [[ "${branch}" == "HEAD" || -z "${branch}" ]]; then
    branch=$(git -C "${current_dir}" rev-parse --short HEAD 2>/dev/null)
  fi

  git_status=""
  if [[ -n $(git -C "${current_dir}" status --porcelain 2>/dev/null) ]]; then
    git_status=" *"
  fi

  commit_hash=$(git -C "${current_dir}" rev-parse --short HEAD 2>/dev/null)

  git_tag=$(git -C "${current_dir}" tag --points-at HEAD 2>/dev/null | head -n 1)
  tag_info=""
  if [[ -n "${git_tag}" ]]; then
    if ((${#git_tag} > 12)); then
      git_tag="${git_tag:0:12}…"
    fi
    tag_info=" "$''" ${git_tag}"
  fi

  git_info=" │ "$'\ue702'" ${branch}${git_status} (${commit_hash})${tag_info}"
fi

lang_info=""
if go_mod=$(find_up "${current_dir}" "go.mod"); then
  if command -v go >/dev/null 2>&1; then
    go_version=$(go version 2>/dev/null | awk '{print $3}' | sed 's/^go//')
    [[ -n "${go_version}" ]] && lang_info=" │ "$'\ue65e'" ${go_version}"
  fi
elif package_json=$(find_up "${current_dir}" "package.json"); then
  if command -v node >/dev/null 2>&1; then
    node_version=$(node --version 2>/dev/null | sed 's/^v//')
    [[ -n "${node_version}" ]] && lang_info=" │ "$'\ued0d'" ${node_version}"
  fi
elif cargo_toml=$(find_up "${current_dir}" "Cargo.toml"); then
  if command -v rustc >/dev/null 2>&1; then
    rust_version=$(rustc --version 2>/dev/null | awk '{print $2}')
    [[ -n "${rust_version}" ]] && lang_info=" │ "$'\ue7a8'" ${rust_version}"
  fi
fi

aws_info=""
sso_cache_dir="${HOME}/.aws/sso/cache"
if command -v jq >/dev/null 2>&1 && [[ -d "${sso_cache_dir}" ]]; then
  latest_cache_file=$(find "${sso_cache_dir}" -name '*.json' -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -n 1)

  if [[ -n "${latest_cache_file}" ]]; then
    expires_at=$(jq -r '.expiresAt // empty' "${latest_cache_file}" 2>/dev/null)

    if [[ -n "${expires_at}" ]]; then
      expiration_epoch=""
      if [[ "$(uname -s)" == "Darwin" ]]; then
        clean_expires_at="${expires_at%Z}"
        clean_expires_at="${clean_expires_at%%.*}Z"
        expiration_epoch=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "${clean_expires_at}" "+%s" 2>/dev/null)
      else
        expiration_epoch=$(date -d "${expires_at}" "+%s" 2>/dev/null)
      fi

      current_epoch=$(date "+%s")
      if [[ -n "${expiration_epoch}" ]]; then
        seconds_left=$((expiration_epoch - current_epoch))

        if ((seconds_left > 0)); then
          hours=$((seconds_left / 3600))
          minutes=$(((seconds_left % 3600) / 60))
          seconds=$((seconds_left % 60))
          time_left=$(printf "%02d:%02d:%02d" "${hours}" "${minutes}" "${seconds}")
          aws_info=" │ ☁️ ${time_left}"
        else
          aws_info=" │ ☁️ Expired"
        fi
      fi
    fi
  fi
fi

context_info=""
if command -v jq >/dev/null 2>&1; then
  context_pct=$(jq -r '.context_window.used_percentage // empty' <<<"${input}" 2>/dev/null)
  if [[ "${context_pct}" =~ ^[0-9]+$ ]]; then
    ((context_pct > 100)) && context_pct=100

    filled=$((context_pct / 10))
    empty=$((10 - filled))
    filled_bar=""
    empty_bar=""
    for ((i = 0; i < filled; i++)); do filled_bar+="█"; done
    for ((i = 0; i < empty; i++)); do empty_bar+="░"; done

    if ((context_pct >= 70)); then
      color_start=$'\033[31m'
      color_end=$'\033[0m'
    elif ((context_pct >= 50)); then
      color_start=$'\033[33m'
      color_end=$'\033[0m'
    else
      color_start=""
      color_end=""
    fi

    context_info=" │ Context: ${color_start}[${filled_bar}${empty_bar}] ${context_pct}%${color_end}"
  fi
fi

cost_info=""
cost_usd=$(otel_cost_usd "${session_id}" "${model_id}")
if [[ -n "${cost_usd}" ]]; then
  cost_info=" │ Cost: ~$(format_usd "${cost_usd}")"
fi

printf "🤖 %s%s%s │ 📁 %s%s%s%s" \
  "${model_display}" \
  "${context_info}" \
  "${cost_info}" \
  "${dir_name}" \
  "${git_info}" \
  "${lang_info}" \
  "${aws_info}"
