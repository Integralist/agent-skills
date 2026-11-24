# GitHub Issues Project Workspace

Use this guide when the user or calling skill passes `--github`, an issue
number (`#<n>`), or a GitHub issue URL, or when the current session's active
project is already tracked in GitHub Issues. Keep `projects/<yyyy-mm-dd>-<slug>/`
as the default when GitHub mode is not selected.

A project lives **either** on disk (`projects/<yyyy-mm-dd>-<slug>/`) **or** in
GitHub Issues: leave project documents solely as Root Issue Artifacts and do
not persist files under `projects/` unless the repository's `AGENTS.md`
explicitly requires on-disk project records in Git (in which case persist only
those required files). Durable repo files (`docs/specs/*.feature`, `docs/adr/`,
`docs/research/`, `GLOSSARY.md`) stay in Git via PRs. Keep remote GitHub
writes behind explicit user approval.

## Label bootstrap

Before creating the first project, slice, or task issue (never during read-only
discovery or when inspecting a cited issue), ensure the workflow labels exist:

```bash
gh label create project --description "Root project tracking issue" --color 1D76DB --force
gh label create slice --description "Vertical implementation slice sub-issue" --color 0E8A16 --force
gh label create task --description "Executable task sub-issue within a slice" --color FBCA04 --force
```

## 3-level issue hierarchy and naming

Map projects onto a 3-level GitHub Sub-Issue tree using `--parent` and
`--blocked-by`, keeping descriptions scannable and self-contained for readers
unfamiliar with the project by reading and following
[voice-product](../voice-product/SKILL.md) (decision-first summary above
`<details>`, dense detail collapsed below; replace stale status rather than
appending chronology):

1. **Root Project Issue (`--label project`):**
   - **Title:** `<Project Title> (<slug>)`
   - **Body:** Follows [PROJECT-README.md](PROJECT-README.md) with a `Slug` row
     in its opening metadata table. Lead with a short summary and one concrete
     `Next action`; link artifacts instead of repeating them.
   - **Lazy creation:** First skill that writes a project artifact creates the
     Root Issue if none is active, attaches its artifact, and passes
     `#<root-issue>` downstream.
2. **Slice Sub-Issues (`--label slice`, `--parent <root-issue>`):**
   - **Title:** `<slug> / S<N>: <Slice Title>` (pass `--blocked-by` for
     earlier dependent slices).
   - **Body:** Keep `## Problem` (context plus `Parent Project`, `Artifacts`,
     `Gate`, `Blocked by`) and `## Solution` (what changes, why, `Status`)
     short and scannable—link shared `plan.md` sections instead of copying
     them. Collapse `M<n>.<m>` milestones/task links and `Consumes`/`Produces`/
     `Acceptance Verification`/`Starting Context` inside `<details>` blocks.
     Do not attach artifacts to Slice issues.
3. **Task Sub-Issues (`--label task`, `--parent <slice-issue>`):**
   - **Title:** `<slug> / S<N>-T<M>: <Task Title>` (created just-in-time one
     slice at a time by `to-tasks` or `execute-plan`, chained with
     `--blocked-by`).
   - **Body:** Keep `## Problem` (context plus `Parent Slice`, `Blocked by`,
     `Supports`), `## Solution` (`Location`, one-line `Verify`), and optional
     `## Notes` brief. Collapse `Stub`, `Test (red)`, and `Implementation
     guidance (green)` inside `<details>` as concise bullets—never repeat
     `AGENTS.md` inline. Do not attach artifacts to Task issues, and omit the
     trailing `- [ ] Task <n> complete` checkbox (open/closed state tracks it).

## Root Issue Artifacts

Store project-level documents on the **Root Project Issue** via `gh issue
artifact`:

- `plan.md`: `gh issue artifact create <root> --name "plan.md" --type plan --body-file -`
- All other project docs (`project.md`, `discovery*.md`, `design*.md`,
  `intent.md`, `research.md`, `spec.md`, `prd.md`, `execution.md`, and
  project-scoped `ADR-<NNNN>.md` indexed in `docs/adr/README.md`):
  `gh issue artifact create <root> --name "<filename>" --body-file -`
- Read/update with `gh issue artifact list`, `view --json body --jq .body`,
  and `edit --body-file -`. Publish only the extracted artifact body, not the
  CLI's rendered metadata. Preserve frontmatter that belongs to the document
  itself. Update the Root Issue's `## Artifacts` table and `## Next action`
  when artifacts change.

## Discovery and formatting

- **Explicit issue reference:** Verify any URL's `<owner>/<repo>` matches
  `gh repo view --json nameWithOwner --jq .nameWithOwner`; reject
  foreign-repository issue URLs rather than targeting the current checkout.
  Inspect read-only (`gh issue view <id> --json number,title,state,labels,body,parent,subIssues,blockedBy`)
  and follow `parent` up to the Root Issue.
- **Listing:** Use `gh issue list --label project --state open` (ask if
  multiple match), and traverse `subIssues` or filter `in:title "<slug> /"`
  with `--label=slice` / `--label=task`.
- **GitHub formatting:** Do not hard-wrap prose at 80 columns (GitHub renders
  single newlines as `<br>`). Use descriptive link text alongside the issue
  number (e.g. `[Slice 1](https://github.com/<owner>/<repo>/issues/25) (#25)`). Caption `Produces:` code blocks and
  spell out lettered IDs (`Slice 1 (S1)`, `Milestone 1.1 (M1.1)`) before first
  use.

## Branch guard, execution, and hybrid closure lifecycle

1. **Branch guard:** Before the first implementation edit in `next-task`,
   `next-slice`, or `execute-plan`, if on `main`/`master`, switch to or create
   the feature branch from `plan.md` (or create one by reading and following
   [branch](../branch/SKILL.md)) unless the user explicitly approved committing
   to the default branch.
2. **Task completion (closes locally):** After verification and local commit,
   post the [BUILD-ITEM.md](BUILD-ITEM.md) evidence table and commit SHA via
   `gh issue comment <task-issue> --body-file -`, require it to succeed, then
   run `gh issue close <task-issue>` (`gh issue close` has no comment-file
   flag). A task does not wait for PR merge or parent slice acceptance unless
   its own outcome requires that gate. In `execute-plan`, include commit
   trailers:

   ```text
   Execution-Plan: #<root-issue>
   Execution-Task: slice-<n>/task-<m> (#<task-issue>)
   Execution-Kind: implementation
   ```

3. **Slice acceptance (closes locally):** Once all Task Sub-Issues are closed
   and [ACCEPT-SLICE.md](ACCEPT-SLICE.md) passes locally, tick `M<n>.<m>`
   checkboxes in `#<slice-issue>`, post the acceptance summary with `gh issue
   comment <slice-issue> --body-file -`, require it to succeed, then close
   `#<slice-issue>`.
4. **PRs and Root Issue closure (`open-pr`, `stacked-prs`):** Keep
   `#<root-issue>` open until code merges to the default branch:
   - **Single or final slice PR:** `- Closes #<root-issue>` and
     `- Delivers #<slice-issue>` as separate bullets.
   - **Early / WIP PR:** Use `gh pr create --draft`.
   - **Partial / stacked slice PR with slices remaining:** Use
     `- Part of #<root-issue>` and `- Delivers #<slice-issue>` (never
     `Closes #<root-issue>` until the final slice PR).

## Task and PR reconciliation

Before drafting or updating a PR, and when recovering missed task closure:

- Inventory every delivered task from the plan, issue links, execution
  records, commits and actual diff, not only the first task or parent slice.
- For every task, verify its own outcome, required checks, commit SHA, posted
  evidence and issue state. Publish missing evidence before closing a verified,
  committed task; leave tasks with missing required checks or approval open.
  Follow step 2 above, with approved GitHub writes.
- For already merged work, verify the delivered snapshot and reuse valid
  evidence; rerun missing or affected checks and record limits. Do not invent
  past results or repeat completed implementation to recover bookkeeping.
- List every delivered task in the PR as `- Delivers #<task-issue> — <title>`
  with its state and evidence link. `Delivers` is a navigation label, not a
  GitHub closing keyword; it never replaces task evidence and explicit
  closure. Keep Root Issue and slice references under step 4 above; do not add
  `Closes` for an incomplete task.
- Task closure does not accept a slice, satisfy ratification, or close the Root
  Issue. Reconcile parent summaries and plan status without advancing their
  gates or milestone checkboxes.

## Local mirror and offline outbox

Never store local mirrors inside the Git checkout. Before reading or writing
GitHub issues or artifacts, read and follow
[GITHUB-OFFLINE-MIRROR.md](GITHUB-OFFLINE-MIRROR.md) to keep the local mirror
warm and handle outages via the offline outbox.
