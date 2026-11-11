#!/usr/bin/env bash
#
# One-line status output for the Makefile install targets.
#
# Usage:
#   step.sh [options] <label> <command> [args...]  # run quietly, report outcome
#   step.sh --section <name>                       # blank line + bold section header
#   step.sh --ok <text>                            # success line, nothing to run
#   step.sh --warn <text>                          # something needs attention, not an error
#   step.sh --skip <text>                          # skipped step (missing prerequisite)
#
# Options:
#   --timeout <sec>   abort command after <sec> seconds
#   --optional        warn and continue on failure or timeout
#   --timing          append the command's elapsed time to its status (exit 0)
#
# A command's output is captured rather than streamed, so a successful run is
# just a short list of statuses. On failure the whole captured stream (stdout
# and stderr) is printed indented under the ❌ line and the exit status is
# propagated, so make halts and nothing is hidden.
#
# Colour and the transient ⏳ line are emitted only on a terminal, keeping
# piped or redirected output clean.

set -uo pipefail

if [ -t 1 ]; then
	bold=$'\033[1m'
	dim=$'\033[2m'
	reset=$'\033[0m'
	erase=$'\r\033[K'
else
	bold='' dim='' reset='' erase=''
fi

timeout=""
optional=false
timing=false
timed_out=false

while [ $# -gt 0 ]; do
	case "${1:-}" in
	--section)
		printf '\n%s%s%s\n' "$bold" "$2" "$reset"
		exit 0
		;;
	--ok)
		printf '  ✅ %s\n' "$2"
		exit 0
		;;
	--warn)
		printf '  🔔 %s\n' "$2"
		exit 0
		;;
	--skip)
		printf '  💤 %s%s%s\n' "$dim" "$2" "$reset"
		exit 0
		;;
	--timeout)
		timeout="$2"
		shift 2
		;;
	--optional)
		optional=true
		shift
		;;
	--timing)
		timing=true
		shift
		;;
	*)
		break
		;;
	esac
done

label=$1
shift

# Progress line, overwritten by the result. Pointless without a terminal.
if [ -n "$erase" ]; then
	printf '  ⏳ %s' "$label"
fi

start_seconds=$SECONDS
start_microseconds=""
if [ "$timing" = true ] && [ -n "${EPOCHREALTIME+x}" ]; then
	start_microseconds=${EPOCHREALTIME/./}
fi

if [ -n "$timeout" ]; then
	tmp_out=$(mktemp)
	set -m
	"$@" > "$tmp_out" 2>&1 &
	cmd_pid=$!
	set +m

	(
		sleep "$timeout"
		kill -TERM -"$cmd_pid" 2>/dev/null
		sleep 1
		kill -KILL -"$cmd_pid" 2>/dev/null
	) &
	watcher_pid=$!

	wait "$cmd_pid" 2>/dev/null || status=$?
	status=${status:-0}

	kill "$watcher_pid" 2>/dev/null || true
	wait "$watcher_pid" 2>/dev/null || true

	output=$(cat "$tmp_out")
	rm -f "$tmp_out"

	if [ "$status" -eq 143 ] || [ "$status" -eq 137 ] || [ "$status" -eq 124 ]; then
		timed_out=true
	fi
else
	output=$("$@" 2>&1) || status=$?
	status=${status:-0}
fi

timing_suffix=""
if [ "$timing" = true ]; then
	if [ -n "$start_microseconds" ]; then
		elapsed_microseconds=$((${EPOCHREALTIME/./} - start_microseconds))
		elapsed_tenths=$(((elapsed_microseconds + 50000) / 100000))
		printf -v timing_suffix ' (%d.%ds)' "$((elapsed_tenths / 10))" "$((elapsed_tenths % 10))"
	else
		printf -v timing_suffix ' (%ds)' "$((SECONDS - start_seconds))"
	fi
fi

if [ "$status" -eq 0 ]; then
	printf '%s  ✅ %s%s\n' "$erase" "$label" "$timing_suffix"
elif [ "$timed_out" = true ]; then
	if [ "$optional" = true ]; then
		printf '%s  🔔 %s (timed out after %ss — skipped)%s\n' "$erase" "$label" "$timeout" "$timing_suffix"
		exit 0
	else
		printf '%s  ❌ %s (timed out after %ss)%s\n' "$erase" "$label" "$timeout" "$timing_suffix"
		[ -n "$output" ] && printf '%s\n' "$output" | sed 's/^/     /'
		exit 124
	fi
elif [ "$optional" = true ]; then
	printf '%s  🔔 %s (failed — skipped)%s\n' "$erase" "$label" "$timing_suffix"
	[ -n "$output" ] && printf '%s\n' "$output" | sed 's/^/     /'
	exit 0
else
	printf '%s  ❌ %s%s\n' "$erase" "$label" "$timing_suffix"
	[ -n "$output" ] && printf '%s\n' "$output" | sed 's/^/     /'
	exit "$status"
fi
