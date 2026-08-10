# Google Workspace MCP server

A self-contained [MCP](https://modelcontextprotocol.io) server exposing Google
Workspace tools — Calendar, Drive, Docs, Sheets, Slides, Gmail, Chat, and
People — to any MCP-capable agent (Claude Code, opencode, Gemini CLI, Codex,
…). Each agent connects the user to **their own** Google account via browser
OAuth; no shared credentials and no per-user Google Cloud project.

## Provenance and license

`dist/index.js` is an **unmodified** prebuilt bundle of the upstream Google
Workspace extension, redistributed under the Apache License 2.0.

- **Upstream:** <https://github.com/gemini-cli-extensions/workspace>
- **Ref:** `v0.0.8` (commit `c3fe28298ed7d98d60b3cf4ac2420c5826d4b97a`)
- **License:** Apache-2.0 — see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE)

## Contents

- `dist/index.js` — the MCP server bundle (runs on plain `node`, no install)
- `launch.sh` — self-locating launcher; resolves `node` and execs the bundle
- `gemini-extension.json` — marker that anchors OAuth token storage to the
  install directory (the server walks up from the bundle to find it)
- `LICENSE`, `NOTICE` — Apache-2.0 license and attribution

## Install

```bash
make install-google-workspace-mcp
```

Copies this directory to `~/.local/share/google-workspace-mcp/`. Every agent's
MCP config points there via `$HOME`, so nothing is tied to a specific username.

> [!NOTE]
> Requires Node.js. `launch.sh` looks for `node` on `PATH` and falls back to
> fnm's default alias. It installs nothing — the bundle is self-contained.

## Authentication

On first tool use the server opens a browser for Google OAuth consent. The
resulting token is encrypted at rest with a locally generated master key and
stored **beside `gemini-extension.json`** in the install directory:

- `~/.local/share/google-workspace-mcp/gemini-cli-workspace-token.json`
- `~/.local/share/google-workspace-mcp/.gemini-cli-workspace-master-key`

Both are git-ignored and shared across every agent, so you authenticate once.
Call the `auth_clear` tool to reset credentials and re-login.

> [!NOTE]
> Browser-based OAuth only. Headless/SSH environments are not supported by
> this install.

## Connecting an agent

opencode and Gemini CLI are wired automatically by this repo's configs
(`.config/opencode/config.json.tmpl`, `.gemini/settings.json`). For Claude
Code, register it once:

```bash
claude mcp add google-workspace -- \
  bash -c 'exec "$HOME/.local/share/google-workspace-mcp/launch.sh"'
```

Any other MCP client works too — point its server config at
`bash -c 'exec "$HOME/.local/share/google-workspace-mcp/launch.sh"'`.

> [!NOTE]
> Tools use underscore-separated names (e.g. `gmail_send`, `calendar_list`,
> `docs_getText`).

## Updating the bundle

```bash
make check-google-workspace-mcp    # is a newer stable release out?
make update-google-workspace-mcp   # download it and bump the recorded ref
```

`update` replaces `dist/index.js` and rewrites the ref in
`gemini-extension.json`, `NOTICE`, and this file; review the diff and commit it.
Nothing is written unless the download and extract both succeed. Pass
`ARGS=--force` to re-download the release already vendored.

`make install` runs the **check** for you and prints a 🔔 line when a newer
release is out. It never applies one — that would leave tracked files modified
as a side effect of an install — so running `update` stays a deliberate step you
take when you're ready to commit the bump.

A missing `gh`, an unreachable GitHub, or a rate-limited API prints a `💤` line
and the install carries on.

Only **stable** releases are tracked. Upstream also publishes weekly `preview-*`
pre-releases, but those carry no build artifacts, so adopting one means building
from tagged source (`npm ci && npm run build`) and vendoring an untagged commit
— do that by hand if you need an unreleased feature.

> [!NOTE]
> `dist/index.js` is byte-identical in the darwin, linux, and win32 release
> tarballs — they differ only in native `node_modules`, which aren't vendored.
> The update always pulls the linux asset, so the result is the same on any
> machine.
