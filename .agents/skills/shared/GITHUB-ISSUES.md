# GitHub Issues Project Workspace

Use this guide when the user or calling skill passes `github`, an issue
number (`#<n>`), or a GitHub issue URL, or when the current session's active
project is already tracked in GitHub Issues. Keep the on-disk
`projects/<yyyy-mm-dd>-<slug>/` workspace as the default when GitHub mode is
not selected.

A project lives **either** on disk (`projects/<yyyy-mm-dd>-<slug>/`) **or** in
GitHub Issues: leave project documents solely as Root Issue Artifacts and do not
persist files under `projects/` unless the repository's `AGENTS.md` explicitly
requires on-disk project records in Git (in which case, persist only the
`AGENTS.md`-required files under `projects/`). Durable repository files
(`docs/specs/<capability>.feature`, `docs/adr/README.md`, system-wide
`docs/adr/ADR-<NNNN>.md`, `docs/research/`, and `GLOSSARY.md`) remain on disk
in Git and are delivered via pull requests. Keep remote GitHub writes behind
explicit user approval.

## Label bootstrap

Before creating the first project, slice, or task issue (never during read-only
discovery or when inspecting a cited issue), ensure the three workflow labels
exist idempotently in the current repository:

```bash
gh label create project --description "Root project tracking issue" --color 1D76DB --force
gh label create slice --description "Vertical implementation slice sub-issue" --color 0E8A16 --force
gh label create task --description "Executable task sub-issue within a slice" --color FBCA04 --force
```

## 3-level issue hierarchy and naming

Map the on-disk project structure onto a 3-level GitHub Sub-Issue tree using
`--parent` and `--blocked-by`:

1. **Root Project Issue (`--label project`):**
   - **Title:** `<Project Title> (<slug>)`
   - **Body:** Replaces `projects/<date>-<slug>/README.md`, following
     [PROJECT-README.md](PROJECT-README.md). Add a `Slug` row with value
     `<slug>` to its opening Field/Value metadata table.
   - **Lazy creation rule:** First skill that writes a project artifact creates
     the Root Issue if no active Root Issue exists in the session or arguments,
     attaches its artifact, and passes `#<root-issue>` to downstream steps.
2. **Slice Sub-Issues (`--label slice`, `--parent <root-issue>`):**
   - **Title:** `<slug> / S<N>: <Slice Title>`
   - **Dependencies:** Pass `--blocked-by <slice-issue>` for slices that depend
     on earlier slices.
   - **Body:** Self-contained slice contract created by `to-plan` (Parent
     Project link, Spec/Plan artifact links, `Delivers`, `Blocked by`,
     `Consumes`/`Produces` with captioned signature blocks, `M<n>.<m>`
     milestone checkboxes, and the `Acceptance Verification` table). When
     `to-tasks` compiles the slice, append `## Context for the executor` to
     this Slice Sub-Issue body. Do not attach artifacts to Slice issues.
3. **Task Sub-Issues (`--label task`, `--parent <slice-issue>`):**
   - **Title:** `<slug> / S<N>-T<M>: <Task Title>`
   - **Just-in-time creation:** Created one slice at a time by `to-tasks` (or
     `execute-plan` Step 2) against live code, chained in dependency order with
     `--blocked-by <prev-task-issue>`.
   - **Body:** Self-contained task contract (`Delivers`, `Parent Slice` link,
     `Blocked by` link, `Supports` milestone keys, `Location`, optional
     `Stub`, `Test (red)`, `Implementation guidance (green)`, and `Verify`). Do
     not attach artifacts to Task issues, and omit the trailing
     `- [ ] Task <n> complete` checkbox (the Task Sub-Issue's open/closed state
     tracks completion).

## Root Issue readability

Before writing or revising the description, read and apply
[voice-product](../voice-product/SKILL.md). Treat the Root Issue as navigation
and current status, not a second spec or an accumulating project diary.

- **Summary:** Two or three sentences: the problem, intended outcome and
  major scope boundary. Link detailed requirements rather than repeating them.
- **Next action:** Put it near the top. Name one owner, one immediate action
  and its destination. Keep blocking approvals explicit; link later steps.
- **Artifacts:** Keep purposes and statuses to short phrases. Link review
  findings and verification evidence instead of embedding their history.
- **Gates:** Keep governing approvals, current blockers and verification
  limits visible, with one concise statement and a link for each.
- **Supporting detail:** Keep request history in intent, requirements and
  open decisions in the spec, and sources/coordination notes in research.
  Prefer links; use <details> only when secondary context belongs here.

Retain required project metadata and PDD approval tables. On updates, replace
stale status rather than appending chronology. Preserve unique evidence in its
owning artifact or an issue comment before removing it from the description.
These brevity rules do not shorten Slice or Task contracts.

## Root Issue Artifacts

Store all project-level documents as Issue Artifacts on the **Root Project
Issue** using `gh issue artifact`:

| Document | Artifact command & type |
| --- | --- |
| `project.md`, `discovery[-mN].md`, `design[-mN].md` | `gh issue artifact create <root> --name "<filename>" --body-file -` (default `generic`) |
| `intent.md`, `research.md`, `spec.md`, `prd.md` | `gh issue artifact create <root> --name "<filename>" --body-file -` (default `generic`) |
| `plan.md` | `gh issue artifact create <root> --name "plan.md" --type plan --body-file -` |
| `ADR-<NNNN>.md` (project-scoped) | `gh issue artifact create <root> --name "ADR-<NNNN>.md" --body-file -`; index its artifact URL in `docs/adr/README.md` |
| `execution.md` (`execute-plan` log) | `gh issue artifact create <root> --name "execution.md" --body-file -` |

List and read existing artifacts on the Root Issue with:

```bash
gh issue artifact list <root> --json number,name,type,url
gh issue artifact view <root> <artifact-number> --json body --jq .body
gh issue artifact edit <root> <artifact-number> --body-file -
```

Whenever an artifact is created or its status changes, update the `##
Artifacts` table and `## Next action` in the Root Issue body (`gh issue edit
<root> --body-file -`).

## Discovery and selection

- **Explicit issue reference:** If the user passes `#<number>` or an issue URL,
  first verify any URL's `<owner>/<repo>` matches the current checkout
  (`gh repo view --json nameWithOwner --jq .nameWithOwner`); reject
  foreign-repository issue URLs and stop rather than passing a bare `#<number>`
  that targets the checkout's repository. Inspect the issue with `gh issue view
  <id> --json number,title,state,labels,body,parent,subIssues,blockedBy`
  (read-only; do not bootstrap labels or mutate the issue). If it is a Slice or
  Task sub-issue, resolve its `parent` chain to identify the Root Issue.
- **Listing open projects:** Run `gh issue list --label project --state open`
  (or `gh issue list --search 'in:title "(<slug>)" state:open' --label=project`
  when the project slug is known). If more than one open project matches, ask
  the user which one to use.
- **Listing slices or tasks for a project:** Traverse `subIssues` from the
  parent issue (`gh issue view <parent> --json subIssues`) or filter by slug
  and label:

  ```bash
  gh issue list --search 'in:title "<slug> /" state:open' --label=slice
  gh issue list --search 'in:title "<slug> /" state:open' --label=task
  ```

## Formatting and cross-reference rules

- **Do not hard-wrap prose at 80 columns** in GitHub Issue bodies, comments, or
  Issue Artifacts. GitHub's issue renderer converts single newlines inside a
  paragraph into hard `<br>` line breaks. Write each paragraph and list item on
  a single line.
- **Use descriptive link text alongside the issue number** for every issue
  cross-reference so readers know what target an issue ID refers to without
  hovering (for example,
  `[Slice 1](https://github.com/<owner>/<repo>/issues/25) (#25)` or
  `[Task 1](https://github.com/<owner>/<repo>/issues/27) (#27)`).
- **Caption signature code blocks:** Introduce any code block under
  `Produces:` with a short phrase explaining what the snippet represents.

## Branch guard, execution, and hybrid closure lifecycle

1. **Branch guard before edits:** Before making the first implementation edit
   in `next-task`, `next-slice`, or `execute-plan`, check the current Git
   branch. If on `main` or `master`, switch to or create the feature branch
   named in `plan.md`'s `Pull Request Delivery` table (or run the
   [branch skill](../branch/SKILL.md) to create `<git-username>/<slug>`) unless
   the user explicitly approved committing to the default branch.
2. **Task completion (closes locally per task):** When a task passes
   verification and is committed locally, post its
   [BUILD-ITEM.md](BUILD-ITEM.md) evidence table and commit SHA as a comment on
   `#<task-issue>` (`gh issue comment <task-issue> --body-file -`), require the
   comment command to succeed, and then close the issue (`gh issue close
   <task-issue>`). In `execute-plan`, use these commit trailers:

   ```text
   Execution-Plan: #<root-issue>
   Execution-Task: slice-<n>/task-<m> (#<task-issue>)
   Execution-Kind: implementation
   ```

3. **Slice acceptance (closes locally per `ACCEPT-SLICE.md`):** When all Task
   Sub-Issues under `#<slice-issue>` are closed and
   [ACCEPT-SLICE.md](ACCEPT-SLICE.md) passes locally, tick the `M<n>.<m>`
   milestone checkboxes in `#<slice-issue>`'s body, post the slice acceptance
   and review summary (`gh issue comment <slice-issue> --body-file -`), require
   it to succeed, and close `#<slice-issue>` (`gh issue close <slice-issue>`).
   Closing accepted slices locally allows subsequent
   `next-slice` or `execute-plan` runs to see immediately which slice is next.
4. **Pull requests and Root Issue closure (`open-pr`, `stacked-prs`):** Keep
   `#<root-issue>` open during local execution so the repository's issue list
   reflects active/in-review work until code lands on the default branch:
   - **Single PR or final slice PR:** Include `Closes #<root-issue>` and list
     delivered slices (`Delivers #<slice-issue>`). When the PR merges to the
     default branch, GitHub closes `#<root-issue>` automatically.
   - **Early backup or work-in-progress PR:** If open Slice Sub-Issues remain
     on `#<root-issue>` and you want to push work to GitHub early (for example,
     before time away), open a draft PR (`gh pr create --draft`). Pushing a
     branch or opening a draft PR does not close `#<root-issue>` until merged.
   - **Partial or stacked slice PR merged before the project is complete:** If
     a PR merges an individual slice while other Slice Sub-Issues on
     `#<root-issue>` remain open, use `Part of #<root-issue>` and `Delivers
     #<slice-issue>` (never `Closes #<root-issue>`) so merging that slice does
     not close the project early. Put `Closes #<root-issue>` only on the final
     slice PR.
