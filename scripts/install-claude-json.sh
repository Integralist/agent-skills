#!/usr/bin/env bash
#
# Install the mcpServers block of ~/.claude.json from .claude.json.tmpl.
#
# ~/.claude.json holds many settings we don't manage, so it is never
# overwritten wholesale. When it is absent the injected template becomes the
# file verbatim; when it exists, our mcpServers are deep-merged over the
# existing object (ours win, manually-added servers survive, nothing else is
# touched). Requires the 1Password CLI, plus jq for the merge path — the
# Makefile checks for both before calling this.
#
# Failures leave ~/.claude.json untouched: every write goes to a temp file
# first and is moved into place only once the previous step succeeded.

set -euo pipefail

template=.claude.json.tmpl
target=$HOME/.claude.json

tmp=$(mktemp)
trap 'rm -f "$tmp" "$tmp.merged"' EXIT

op inject --account fastly.1password.com -i "$template" -o "$tmp" -f

if [ ! -f "$target" ]; then
	mv "$tmp" "$target"
	exit 0
fi

jq -s '.[0] as $cur | .[1] as $tmpl | $cur | .mcpServers = (($cur.mcpServers // {}) + $tmpl.mcpServers)' \
	"$target" "$tmp" >"$tmp.merged"
mv "$tmp.merged" "$target"
