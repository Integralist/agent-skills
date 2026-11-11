#!/usr/bin/env bash
# Skip reinstalling the global Pi CLI when it already matches the registry.

set -uo pipefail

package=@earendil-works/pi-coding-agent
step=(bash scripts/step.sh)
current=""
latest=""

if command -v pi >/dev/null 2>&1; then
	current=$(pi --version 2>/dev/null || true)
fi
if command -v npm >/dev/null 2>&1; then
	latest=$(npm_config_fetch_timeout="${PI_VERSION_CHECK_TIMEOUT:-10000}" \
		npm view "$package" version 2>/dev/null || true)
fi

if [ -n "$current" ] && [ -n "$latest" ] && [ "$current" = "$latest" ]; then
	"${step[@]}" --ok "$package already current ($current)"
	exit 0
fi

"${step[@]}" --timing "$package (npm -g)" npm install -g --ignore-scripts "$package"
