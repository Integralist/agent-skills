---
name: cleanup
description: >-
  Audit a codebase or paths for AI slop and clean it up with you steering each
  fix. Use when asked to find and remove sloppy, AI-generated code patterns.
disable-model-invocation: true
argument-hint: '[path | glob]'
metadata:
  model-tier: moderate
---

Audit source files for AI slop in two phases: a read-only subagent proposes
fixes; apply approved ones in the main thread, where the user can veto or adjust
each one. Follow [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md),
including its completion and retry protocol.

1. **Gather files.** With no argument, include every source file except
   vendored, generated, and fixture directories such as `vendor/`,
   `node_modules/`, `testdata/`, and `.git/`. With a path or glob, expand it
   and check that paths exist. If nothing is found, report "No files to
   review" and stop.
2. **Prioritize risk.** Find the top 20 files by changes in the last year and
   the top 20 files most often touched by fix, bug, or broken commits. Flag
   their overlap as the highest-risk files; start the audit there.
3. **Run a read-only audit.** Spawn one read-only audit subagent, in the
   background if agent teams are supported (see
   [AGENT-TEAMS.md](../shared/AGENT-TEAMS.md)). Give it the file list,
   high-risk files, and the audit prompt. Before spawning the subagent, read
   [AUDIT.md](references/AUDIT.md), which contains the exact commands, prompt,
   checklist, output schema,
   and report template. The audit returns a proposed-fix list and a count of
   files with no issues.
4. **Apply fixes with the user.** Present proposals grouped by class, then
   category, before editing. Apply safe fixes; raise any you're second-guessing.
   Show every behavior-changing fix and apply it only after the user approves
   or modifies it. If an applied fix changes behavior, a public API, or usage,
   update the docs or READMEs flagged by the auditor; create a new doc only for
   a wholly new component. Honor "skip", "change approach", or "stop"
   immediately. Track each fix as applied or skipped.
5. **Report.** Before writing, read the report template in
   [AUDIT.md](references/AUDIT.md). Write to
   `docs/reports/<YYYY-MM-DD-HHMM>-cleanup.md`, creating `docs/reports/` first.
   Then give the user a short summary and the report path.
