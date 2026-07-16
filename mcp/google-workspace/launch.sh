#!/usr/bin/env bash
#
# launch.sh - Start the Google Workspace MCP server (stdio).
#
# Self-locating: finds its own dist/ regardless of where it was copied, so no
# absolute paths are baked in. All diagnostics go to stderr to keep stdout
# clean for the MCP stdio protocol.
#
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
server="$here/dist/index.js"

if [ ! -f "$server" ]; then
    echo "google-workspace-mcp: server not found at $server" >&2
    exit 1
fi

# Resolve node. Agents may spawn this with a minimal PATH that misses a
# version-manager shim, so fall back to fnm's default alias before giving up.
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ]; then
    for candidate in \
        "${FNM_DIR:-$HOME/.local/share/fnm}/aliases/default/bin/node" \
        "$HOME/.local/share/fnm/aliases/default/bin/node" \
        /opt/homebrew/bin/node \
        /usr/local/bin/node; do
        if [ -x "$candidate" ]; then
            node_bin="$candidate"
            break
        fi
    done
fi
if [ -z "$node_bin" ]; then
    echo "google-workspace-mcp: 'node' not found on PATH or in fnm default." >&2
    echo "Install Node.js, or add it to PATH for the process that spawns this." >&2
    exit 1
fi

exec "$node_bin" "$server" "$@"
