---
name: spike
description: >-
  Run a time-boxed, throwaway Go spike to settle an empirical backend question
  during design or research. Use when research leaves a consequential runtime,
  performance, concurrency, migration, or API-shape unknown that prose cannot
  resolve.
argument-hint: "[--github] [steering]"
metadata:
  model-tier: moderate
---

Run a throwaway Go spike to settle one empirical backend question that blocks a
spec, ADR, or plan. Every spike ends with a recorded verdict and discarded
spike code; never ship spike code into production or main.

**Initiation gate.** Start a spike only when all three hold:

1. **Paper hit a wall.** Reading code, docs, and issues in
   [research](../research/SKILL.md) left an unknown that
   [grill-with-docs](../grill-with-docs/SKILL.md) cannot reason through.
2. **A design decision depends on it.** Getting the answer wrong would force a
   rewrite of `spec.md`, `plan.md`, an ADR, or a public contract, not a local
   refactor inside one slice.
3. **The question is empirical and falsifiable.** You can state one specific
   question settled by observing real execution: pass or fail, timings, lock
   behavior, query plans, or caller friction.

**Qualifying triggers.** Backend questions that typically pass the gate:

- **Runtime or external behavior:** Undocumented SDK, third-party API,
  database locking, query planner, OS, or protocol behavior.
- **Performance or concurrency bounds:** Latency, allocation, throughput, or
  contention numbers needed to validate an approach or compare two designs.
- **Caller or data shape ergonomics:** Comparing two or three competing Go
  interfaces, API signatures, wire payloads, or SQL schemas against call sites.
- **Migration or compatibility risk:** Testing whether an online schema change,
  parser, or rollout handles production-shaped data safely.

**Disqualifiers.** Stop and route elsewhere when any of these apply:

- **Answerable from source or docs:** Stay in [research](../research/SKILL.md).
- **State-machine or invariant logic:** Use
  [STATE-MODEL.md](../shared/STATE-MODEL.md) with a disposable Python BFS check.
- **Contained inside one slice:** Defer to implementation and TDD in
  [execute-plan](../execute-plan/SKILL.md).
- **Production buildup:** Writing migrations, abstractions, or unit tests under
  a spike label is early implementation, not a spike.

**Guardrails.** Write spikes in Go following
[conventions-go](../conventions-go/SKILL.md). Put standalone spikes in a
disposable module under `/tmp/spike-<slug>/` (`go mod init spike`). When a
spike needs repository types, isolate it on a `spike/<slug>` branch matching
the repo's `go.mod` directive; never commit spike code to `main` or inside
production packages or `migrations/`. Skip unit tests, abstractions, and
production error-handling polish. Use scratch databases or disposable local
files only—never production credentials or data.

Before writing spike code, read [spike branches](references/SPIKE-BRANCHES.md)
for branch templates and the verdict format.

1. **Verify the gate and state the question.** Confirm all three initiation
   rules pass and no disqualifier applies. State the single question and the
   decision that depends on it; ask the user to confirm before coding when
   invoked from [architect](../architect/SKILL.md).
2. **Pick one branch.** Choose Feasibility, Benchmark, or Shape check in
   [spike branches](references/SPIKE-BRANCHES.md).
3. **Run and observe.** Write the minimum Go code needed to answer the
   question, run it, and capture the raw output.
4. **Record the verdict.** Append a `Spike verdict` block to the active
   `projects/<project>/research.md` (or `docs/research/<yyyy-mm-dd>-<slug>.md`
   when standalone, or for `--github` or an issue reference, an Issue Artifact
   per [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md); also use it when this
   session's active project is already tracked in GitHub Issues). Record any
   settled
   settled decision by reading and following [to-adr](../to-adr/SKILL.md)
   when applicable.
5. **Clean up and hand off.** Delete spike files from the working tree (keep a
   `spike/<slug>` branch only if the user asks to archive the primary source).
   Resume [architect](../architect/SKILL.md) at Grill, or stop and report the
   verdict when run standalone.
