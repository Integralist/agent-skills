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
#   --optional        warn and continue on failure or timeout (exit 0)
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

if [ "$status" -eq 0 ]; then
	printf '%s  ✅ %s\n' "$erase" "$label"
elif [ "$timed_out" = true ]; then
	if [ "$optional" = true ]; then
		printf '%s  🔔 %s (timed out after %ss — skipped)\n' "$erase" "$label" "$timeout"
		exit 0
	else
		printf '%s  ❌ %s (timed out after %ss)\n' "$erase" "$label" "$timeout"
		[ -n "$output" ] && printf '%s\n' "$output" | sed 's/^/     /'
		exit 124
	fi
elif [ "$optional" = true ]; then
	printf '%s  🔔 %s (failed — skipped)\n' "$erase" "$label"
	[ -n "$output" ] && printf '%s\n' "$output" | sed 's/^/     /'
	exit 0
else
	printf '%s  ❌ %s\n' "$erase" "$label"
	[ -n "$output" ] && printf '%s\n' "$output" | sed 's/^/     /'
	exit "$status"
fi
