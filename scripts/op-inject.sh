#!/usr/bin/env bash
#
# op-inject.sh — wrap `op inject` so a missing 1Password CLI or an
# unreachable Fastly account skips gracefully instead of aborting install.
#
# The Fastly account holds the Employee vault used by the templated configs.
# Public users without access get a skip line, not a failed `make install`.
#
# Usage:
#   op-inject.sh <label> <template> <output>   # inject, or skip with a status line
#   op-inject.sh --check                        # silent probe; exit 0 if injection is possible

set -uo pipefail

account=fastly.1password.com
step=(bash "$(dirname "$0")/step.sh")

reachable() {
	command -v op >/dev/null 2>&1 || return 1
	op vault list --account "$account" >/dev/null 2>&1
}

if [ "${1:-}" = "--check" ]; then
	reachable
	exit $?
fi

label=$1 template=$2 output=$3

if ! command -v op >/dev/null 2>&1; then
	"${step[@]}" --skip "$label: 1Password CLI (op) not found"
	exit 0
fi
if ! op vault list --account "$account" >/dev/null 2>&1; then
	"${step[@]}" --skip "$label: no Fastly 1Password access"
	exit 0
fi

"${step[@]}" "$label (op inject)" op inject --account "$account" -i "$template" -o "$output" -f
