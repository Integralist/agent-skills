# Omit Needless Words

Shared principle for skills whose human-readable deliverable is prose: docs,
PR/commit messages, changelogs, plans, research, summaries, handoffs, and
ADR/PRD text.

Use the shortest complete explanation, not the fewest words. State the point
first; cut filler, repetition, defensive caveats, and process reminders already
covered by `AGENTS.md`. Prefer plain words, active verbs, and flat bullets over
dense prose or multi-column text tables.

- Keep each obligation in one place; link rather than copy it into any other
  section or document (such as specs, plans, slices, or tasks).
- Expand non-obvious acronyms and explain necessary terms once on first use in
  a short phrase (a few words); do not repeat definitions across sections.
- Preserve exact paths, flags, permissions, timing, ownership, and failure
  rules in their owning artifact; keep the context needed to understand them,
  without padding them with filler.
- Lead with the **summary and decisions**; put heavy **supporting detail**
  (`<details>` or linked files) underneath to keep the page focused.
  Collapsing detail improves focus, not quality: apply the same clarity,
  brevity, and no-duplication rules inside `<details>` as everywhere else.

## Readability budgets

Keep visible sections scannable in one screen:

- Aim for <= 250 words in a GitHub root issue (status, next action, blockers,
  and links).
- Aim for <= 220 words above `<details>` in a slice issue (`Problem`,
  `Solution`, and `Notes` with one fact per bullet, omitting cleared/empty
  gates and duplicate evidence links); put the rest
  inside `<details>` (`⚙️ Technical details` for `Consumes`/`Produces`, tables,
  and verification; `📋 Project metadata` for milestones, `## Tasks`, and
  tracking links).
- Aim for <= 220 words above `<details>` in a task issue (`Problem`,
  `Solution`, and `Notes` with one fact per bullet for `Location`, one-line
  `Verify`, and active blockers only); put
  the rest inside `<details>` (`⚙️ Technical details` for stubs, red tests, and
  guidance; `📋 Project metadata` for `Parent Slice`, `Supports`, `Blocked by`,
  and links).
- Limit lists to ~5 bullets per group, and replace multi-sentence table cells
  with `Name — one-line outcome` bullets.

Use blank lines around Markdown inside `<details>` so GitHub renders it.
