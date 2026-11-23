# GitHub Issues Offline Mirror & Outbox

Read this reference before reading or writing GitHub issues or artifacts in
GitHub mode so the local mirror stays warm for offline work and replay.

## Local mirror and offline outbox

Keep a write-through mirror of every GitHub-tracked project outside the Git
checkout at:

```txt
${XDG_STATE_HOME:-$HOME/.local/state}/project-workspaces/<host>/<owner>/<repo>/<root-issue>-<slug>/
```

If GitHub is unreachable before the Root Issue exists, use
`pending-<yyyy-mm-dd>-<slug>/` and rename it once `#<root-issue>` is created.
Never store these mirrors inside the repository working tree.

- **Mirrored files:** Maintain `manifest.json` (repo, `rootIssue`, `slug`,
  `updatedAt` per synced item, and `idMap` for offline IDs), `root.json`,
  `artifacts/<filename>`, `slices/S<N>.json`, `tasks/S<N>-T<M>.json`, and an
  ordered `outbox.jsonl` queue of deferred mutations.
- **Write-through while online:** On every `gh issue view`, `gh issue edit`,
  `gh issue close`, `gh issue comment`, or `gh issue artifact` read/write,
  refresh the mirrored JSON/file and `manifest.json` timestamps. Before writing
  to GitHub, check `outbox.jsonl`: if pending entries exist, reconcile them
  first instead of overwriting remote state. When first mirroring an existing
  Root Issue (`manifest.json` does not exist yet), run a read-only hydration of
  the Root Issue, all its existing Root Issue Artifacts, and any open Slice or
  Task Sub-Issues so mid-flight projects have a full local backup right away.
- **Degraded reads when GitHub fails:** If `gh` fails due to a network, auth,
  or GitHub outage, print
  `⚠️ GitHub unavailable — running from local mirror and queuing updates.`,
  then read from the mirror.
- **Automatic deferred writes when GitHub fails:** Without pausing for extra
  approval, continue writing artifacts and updating local slice/task state in
  the mirror. Assign placeholder IDs (`local:root`, `local:S<N>`,
  `local:S<N>-T<M>`) for uncreated issues, use that placeholder in commit
  trailers when no remote issue exists yet, and append one JSON object per
  skipped mutation (`create_issue`, `edit_issue`, `comment_issue`,
  `close_issue`, `create_artifact`, `edit_artifact`) to `outbox.jsonl`.
- **Replay on recovery:** When `gh` succeeds again and `outbox.jsonl` is
  non-empty, compare GitHub's current `updatedAt` against `manifest.json`
  first. Stop and ask only if a remote issue or artifact changed more recently
  than the mirror's baseline. Replay `outbox.jsonl` in order, recording each
  `<local-id> -> #<issue>` mapping in `idMap` and substituting those numbers
  into queued bodies, links, and `--parent`/`--blocked-by` flags. Remove
  applied lines and print
  `✅ GitHub back online — synced <N> queued updates to #<root-issue>.`

Use these exact schemas for `manifest.json` and each single-line entry in
`outbox.jsonl` (point `bodyFile` at mirrored Markdown files rather than
inlining large bodies):

```json
{
  "version": 1,
  "host": "github.com",
  "owner": "<owner>",
  "repo": "<repo>",
  "rootIssue": "#123",
  "slug": "<slug>",
  "items": {
    "root": { "id": "#123", "state": "OPEN", "updatedAt": "2026-04-01T10:00:00Z" },
    "artifact:plan.md": { "id": 45, "updatedAt": "2026-04-01T10:05:00Z" }
  },
  "idMap": { "local:S1-T1": "#145" }
}
```

```jsonl
{"op":"create_issue","localId":"local:S1-T1","title":"<slug> / S1-T1: <Title>","labels":["task"],"parent":"#25","blockedBy":["#27"],"bodyFile":"tasks/S1-T1.md"}
{"op":"edit_artifact","root":"#123","name":"plan.md","artifactType":"plan","bodyFile":"artifacts/plan.md","baseUpdatedAt":"2026-04-01T10:05:00Z"}
{"op":"comment_issue","target":"local:S1-T1","bodyFile":"tasks/S1-T1-evidence.md","baseUpdatedAt":null}
{"op":"close_issue","target":"local:S1-T1","baseUpdatedAt":null}
```

- **Cleanup on closure:** Keep the workspace directory while `#<root-issue>`
  is open. When a Task or Slice Sub-Issue closes and has no pending entries in
  `outbox.jsonl`, remove its `tasks/` or `slices/` JSON file (recording
  `"CLOSED"` in `manifest.json`). Delete the entire `<root-issue>-<slug>/`
  mirror directory only when `#<root-issue>` is `CLOSED` on GitHub and
  `outbox.jsonl` is empty. During read-only discovery for the current repo,
  prune any stale mirror directory that meets both conditions. Never delete a
  `pending-*` directory or a mirror with a non-empty `outbox.jsonl`; if GitHub
  closed `#<root-issue>` while `outbox.jsonl` is non-empty, stop and ask.
