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

# OP_ACCOUNT_NAME is the 1Password account subdomain, <name>.1password.com.
# It must be exported; an unset value is an error, not a skip.
if [ -z "${OP_ACCOUNT_NAME:-}" ]; then
	echo "op-inject.sh: OP_ACCOUNT_NAME is not set; export it" >&2
	exit 1
fi
account="$OP_ACCOUNT_NAME.1password.com"
step=(bash "$(dirname "$0")/step.sh")

reachable() {
	command -v op >/dev/null 2>&1 || return 1
	op vault list --account "$account" >/dev/null 2>&1
}

if [ "${1:-}" = "--check" ]; then
	case "${OP_INJECT_STATUS:-}" in
	ready) exit 0 ;;
	missing|unavailable) exit 1 ;;
	*) reachable; exit $? ;;
	esac
fi

label=$1 template=$2 output=$3

if [ "${OP_INJECT_STATUS:-}" = "missing" ] || ! command -v op >/dev/null 2>&1; then
	"${step[@]}" --skip "$label: 1Password CLI (op) not found"
	exit 0
fi
if [ "${OP_INJECT_STATUS:-}" = "unavailable" ] || {
	[ "${OP_INJECT_STATUS:-}" != "ready" ] &&
	! op vault list --account "$account" >/dev/null 2>&1;
}; then
	"${step[@]}" --skip "$label: no Fastly 1Password access"
	exit 0
fi

"${step[@]}" "$label (op inject)" op inject --account "$account" -i "$template" -o "$output" -f
