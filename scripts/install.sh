#!/usr/bin/env bash
# Run independent install sections concurrently while keeping their output grouped.

set -uo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
makefile=$root/Makefile
make_bin=$(command -v make) || {
	echo "install.sh: make not found" >&2
	exit 127
}
tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/agent-skills-install.XXXXXX")
trap 'rm -rf "$tmpdir"' EXIT
unset OP_INJECT_STATUS

spinner_frames=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)
install_started=$SECONDS
op_message=""
op_elapsed=0
op_outcome=skipped
op_preflight_ran=false
all_names=()
all_elapsed=()
all_outcomes=()

if [ -n "${OP_ACCOUNT_NAME:-}" ]; then
	op_preflight_started=$SECONDS
	op_preflight_ran=true
	if ! command -v op >/dev/null 2>&1; then
		OP_INJECT_STATUS=missing
		op_message="  💤 1Password CLI not found; secret injection will be skipped\n"
	else
		account="$OP_ACCOUNT_NAME.1password.com"
		op_has_tty=false
		[ -t 0 ] && op_has_tty=true
		preflight_status=$tmpdir/op.status
		(
			if [ "$op_has_tty" = true ]; then
				op signin --account "$account" < /dev/tty
			else
				op signin --account "$account"
			fi
			status=$?
			if [ "$status" -eq 0 ]; then
				op vault list --account "$account" >/dev/null 2>&1
				status=$?
			fi
			printf '%s\n' "$status" > "$preflight_status.tmp"
			mv "$preflight_status.tmp" "$preflight_status"
		) >"$tmpdir/op.log" 2>&1 &
		op_pid=$!
		frame=0
		while [ ! -f "$preflight_status" ]; do
			if [ -t 1 ]; then
				printf '\r\033[K  ⏳ 1Password sign-in %s' "${spinner_frames[$((frame % ${#spinner_frames[@]}))]}"
				frame=$((frame + 1))
			fi
			sleep 0.1
		done
		wait "$op_pid" 2>/dev/null || true
		if [ -t 1 ]; then
			printf '\r\033[K'
		fi
		op_elapsed=$((SECONDS - op_preflight_started))
		if [ "$(<"$preflight_status")" -eq 0 ]; then
			OP_INJECT_STATUS=ready
			op_outcome=ok
			op_message="  ✅  1Password session ready\n"
		else
			OP_INJECT_STATUS=unavailable
			op_message="  💤 No Fastly 1Password access; secret injection will be skipped\n"
		fi
	fi
	export OP_INJECT_STATUS
fi

all_logs=()
group_names=()
group_targets=()
group_status_files=()
group_pids=()
group_states=()
group_started=()
group_elapsed=()
group_drawn=false

draw_group() {
	[ -t 1 ] || return 0
	local i indicator frame
	if [ "$group_drawn" = true ]; then
		printf '\033[%dA' "${#group_names[@]}"
	fi
	for i in "${!group_names[@]}"; do
		case "${group_states[$i]}" in
		running)
			frame=$((draw_frame % ${#spinner_frames[@]}))
			indicator="${spinner_frames[$frame]} working"
			;;
		succeeded) indicator="✅ done (${group_elapsed[i]}s)" ;;
		failed) indicator="❌ failed (${group_elapsed[i]}s)" ;;
		esac
		printf '\r\033[K  %-26s %s\n' "${group_names[$i]}" "$indicator"
	done
	group_drawn=true
	draw_frame=$((draw_frame + 1))
}

run_group() {
	group_names=()
	group_targets=()
	group_status_files=()
	group_pids=()
	group_states=()
	group_started=()
	group_elapsed=()
	group_drawn=false
	draw_frame=0
	while [ "$#" -gt 0 ]; do
		group_names+=("$1")
		group_targets+=("$2")
		shift 2
	done

	local i target status_file log_file global_offset
	global_offset=${#all_names[@]}
	for i in "${!group_names[@]}"; do
		target=${group_targets[$i]}
		log_file=$tmpdir/target-$(( ${#all_logs[@]} + i )).log
		status_file=$log_file.status
		group_status_files[i]=$status_file
		group_states[i]=running
		group_started[i]=$SECONDS
		group_elapsed[i]=0
		all_names+=("${group_names[$i]}")
		all_elapsed+=(0)
		all_outcomes+=(running)
		all_logs+=("$log_file")
		(
			MAKEFLAGS='' MFLAGS='' MAKELEVEL=0 "$make_bin" --no-print-directory -f "$makefile" "$target" >"$log_file" 2>&1
			status=$?
			printf '%s\n' "$status" > "$status_file.tmp"
			mv "$status_file.tmp" "$status_file"
		) &
		group_pids[i]=$!
	done

	draw_group
	local all_done failed status_value elapsed
	failed=0
	while :; do
		all_done=true
		for i in "${!group_names[@]}"; do
			if [ "${group_states[$i]}" = running ]; then
				if [ -f "${group_status_files[$i]}" ]; then
					status_value=$(<"${group_status_files[$i]}")
					elapsed=$((SECONDS - group_started[i]))
					group_elapsed[i]=$elapsed
					all_elapsed[global_offset + i]=$elapsed
					if [ "$status_value" -eq 0 ]; then
						group_states[i]=succeeded
						all_outcomes[global_offset + i]=ok
					else
						group_states[i]=failed
						all_outcomes[global_offset + i]=failed
						failed=1
					fi
				else
					all_done=false
				fi
			fi
		done
		draw_group
		[ "$all_done" = true ] && break
		sleep 0.1
	done
	for i in "${!group_pids[@]}"; do
		wait "${group_pids[$i]}" 2>/dev/null || true
	done
	return "$failed"
}

setup_failed=0
run_group \
	"Agents" install-agents \
	"Rules" rules \
	"Tools" install-tools || setup_failed=1

install_failed=$setup_failed
if [ "$setup_failed" -eq 0 ]; then
	run_group \
		"Claude" install-claude-section \
		"Pi" install-pi-section \
		"Gemini" install-gemini \
		"Copilot" install-copilot \
		"OpenCode" install-opencode \
		"Codex" install-codex \
		"Swival" install-swival \
		"Google Workspace MCP" install-google-workspace-mcp || install_failed=1
fi

if [ -n "$op_message" ]; then
	printf '\n1Password\n%b' "$op_message"
fi
for log_file in "${all_logs[@]}"; do
	[ -f "$log_file" ] && cat "$log_file"
done

printf '\nInstall timings (elapsed seconds)\n'
if [ "$op_preflight_ran" = true ]; then
	printf '  %-26s %ss %s\n' "1Password" "$op_elapsed" "$op_outcome"
fi
for i in "${!all_names[@]}"; do
	printf '  %-26s %ss %s\n' "${all_names[$i]}" "${all_elapsed[$i]}" "${all_outcomes[$i]}"
done
printf '  %-26s %ss total\n' "Total" "$((SECONDS - install_started))"

if [ "$install_failed" -ne 0 ]; then
	printf '\n❌ Install failed; see the section output above.\n' >&2
	exit 1
fi
printf '\n✨ All set.\n'
