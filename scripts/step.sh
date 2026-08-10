#!/usr/bin/env bash
#
# One-line status output for the Makefile install targets.
#
# Usage:
#   step.sh <label> <command> [args...]  # run quietly, report the outcome
#   step.sh --section <name>             # blank line + bold section header
#   step.sh --ok <text>                  # success line, nothing to run
#   step.sh --skip <text>                # skipped step (missing prerequisite)
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

case "${1:-}" in
--section)
	printf '\n%s%s%s\n' "$bold" "$2" "$reset"
	exit 0
	;;
--ok)
	printf '  ✅ %s\n' "$2"
	exit 0
	;;
--skip)
	printf '  💤 %s%s%s\n' "$dim" "$2" "$reset"
	exit 0
	;;
esac

label=$1
shift

# Progress line, overwritten by the result. Pointless without a terminal.
if [ -n "$erase" ]; then
	printf '  ⏳ %s' "$label"
fi

# The failure status must be read inside the else branch: after `fi` a false
# condition with no else leaves $? at 0, silently turning failures into passes.
if output=$("$@" 2>&1); then
	printf '%s  ✅ %s\n' "$erase" "$label"
else
	status=$?
	printf '%s  ❌ %s\n' "$erase" "$label"
	printf '%s\n' "$output" | sed 's/^/     /'
	exit "$status"
fi
