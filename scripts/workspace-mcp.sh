#!/usr/bin/env bash
#
# Check for and apply updates to the vendored Google Workspace MCP bundle.
#
# Usage:
#   workspace-mcp.sh check             # is a newer release out?
#   workspace-mcp.sh update [--force]  # fetch it, bump the recorded ref
#
# check is what `make install` runs: it only reports, because applying an update
# rewrites tracked files and an install must not dirty the working tree. update
# is the deliberate follow-up, run when you're ready to commit the bump.
# --force re-downloads the release already vendored.
#
# Nothing is ever half-written: the bundle only replaces the working copy once
# the download, the extract, and the size check have all passed.
#
# Only stable releases are tracked. Upstream also publishes weekly `preview-*`
# pre-releases, but those ship no build artifacts, so adopting one would mean
# building from source and vendoring an untagged commit — deliberately out of
# scope here.
#
# dist/index.js is byte-identical in the darwin, linux, and win32 tarballs (they
# differ only in native node_modules, which are not vendored), so the linux
# asset is always used and the result is reproducible on any machine.

set -euo pipefail

repo=gemini-cli-extensions/workspace
root=$(cd "$(dirname "$0")/.." && pwd)
dir=$root/mcp/google-workspace
extension=$dir/gemini-extension.json
notice=$dir/NOTICE
readme=$dir/README.md
# step.sh is not marked executable (matching the other scripts here), so it is
# always invoked through bash.
step() { bash "$root/scripts/step.sh" "$@"; }

mode=${1:-check}
force=false
shift || true
for arg in "$@"; do
	case $arg in
	--force) force=true ;;
	*)
		echo "unknown flag: $arg" >&2
		exit 2
		;;
	esac
done

for tool in gh jq tar; do
	if ! command -v "$tool" >/dev/null; then
		step --skip "google-workspace: $tool not found"
		exit 0
	fi
done

current=v$(jq -r '.version' "$extension")

# Nothing here is essential, so an unreachable or rate-limited API downgrades to
# a skip line rather than an error, whichever mode we're in.
if ! release=$(gh api "repos/$repo/releases/latest" --jq '.tag_name + " " + .published_at[0:10]' 2>&1); then
	step --skip "google-workspace: cannot reach GitHub — $release"
	exit 0
fi
read -r latest published <<<"$release"

if [ "$mode" = check ]; then
	if [ "$current" = "$latest" ]; then
		step --ok "google-workspace $current is the latest stable release ($published)"
	else
		step --warn "google-workspace $current → $latest available ($published) — run: make update-google-workspace-mcp"
	fi
	exit 0
fi

if [ "$mode" != update ]; then
	echo "usage: $(basename "$0") check|update [--force]" >&2
	exit 2
fi

if [ "$current" = "$latest" ] && [ "$force" = false ]; then
	step --ok "google-workspace already on $current (--force re-downloads)"
	exit 0
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

if ! step "Downloaded $latest (linux asset)" \
	gh release download "$latest" --repo "$repo" --pattern 'linux.*' --dir "$tmp"; then
	exit 1
fi
if ! step "Extracted dist/index.js" \
	tar -xzf "$tmp/linux.google-workspace-extension.tar.gz" -C "$tmp" dist/index.js; then
	exit 1
fi

# A truncated or wrong-shaped download must never overwrite a working bundle;
# the real one is ~13MB, so anything under 1MB is a failed extract, not a slim
# release.
size=$(wc -c <"$tmp/dist/index.js" | tr -d '[:space:]')
if [ "$size" -lt 1000000 ]; then
	step --skip "google-workspace: extracted bundle is only $size bytes — left unchanged"
	exit 1
fi

# An annotated tag points at a tag object, which points at the commit; a
# lightweight tag points straight at the commit. NOTICE records the commit.
# Resolve it before touching anything, so a lookup failure can't leave a new
# bundle recorded against a stale commit.
if ! ref=$(gh api "repos/$repo/git/refs/tags/$latest" --jq '.object.type + " " + .object.sha' 2>&1); then
	step --skip "google-workspace: cannot resolve $latest — $ref"
	exit 1
fi
read -r ref_type sha <<<"$ref"
if [ "$ref_type" = tag ]; then
	sha=$(gh api "repos/$repo/git/tags/$sha" --jq '.object.sha')
fi

cp "$tmp/dist/index.js" "$dir/dist/index.js"
step --ok "dist/index.js replaced (${size} bytes)"

# gemini-extension.json is a trimmed marker file, not upstream's copy, so only
# the version field is touched.
jq --arg v "${latest#v}" '.version = $v' "$extension" >"$tmp/extension.json"
mv "$tmp/extension.json" "$extension"

# sed -i is spelled differently on BSD and GNU, so edits go through a temp file
# — which also means a failed sed leaves the original intact.
sed -e "s|^Ref:.*|Ref:       $latest|" \
	-e "s|^Commit:.*|Commit:    $sha|" \
	"$notice" >"$tmp/NOTICE"
mv "$tmp/NOTICE" "$notice"

sed -e "s|^- \*\*Ref:\*\*.*|- **Ref:** \`$latest\` (commit \`$sha\`)|" \
	"$readme" >"$tmp/README.md"
mv "$tmp/README.md" "$readme"

step --ok "Recorded $latest ($sha) in gemini-extension.json, NOTICE, README"
step --ok "Review with: git diff --stat mcp/google-workspace/"
