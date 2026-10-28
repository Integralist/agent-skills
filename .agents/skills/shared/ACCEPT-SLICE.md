# Accept one slice

Verify only the outcomes promised by this slice, whether it was built from a
plan directly or from a compiled task list. Use the same gate in both cases.

1. **Map the outcomes.** Read the slice's source plan and spec when present.
   Account for every milestone and acceptance criterion assigned to this
   slice; without milestones, use the task list's promised outcomes. Keep
   planned later-stage checks with their owning milestones, rather than
   making them current prerequisites. Current obligations cannot be deferred
   merely because their checks fail or are unavailable.
   Record the evidence using [BUILD-ITEM.md](BUILD-ITEM.md)'s format.
   Done when the slice's required outcomes and their checks are identified.

2. **Exercise the slice.** Run project-required checks and regression checks
   applicable to the change, using documented commands. For code, test the
   implementation being delivered; do not substitute a mock for the behaviour
   being verified. External services may be mocked where the agreed
   verification scope allows it. Record the testing boundary and any
   live-service checks not performed. Those checks block completion only when
   required by the current scope or project policy. Base external test doubles
   on authoritative contracts or independently checked fixtures, not assumptions
   copied from the implementation.
   Run acceptance scenarios assigned to this slice, even when no
   compiled boundary task exists. Build the minimum required harness as part
   of the slice; a complete product-wide end-to-end suite is not a prerequisite
   unless this slice's contract or project policy requires it.
   For non-code work, run the assertions and repository checks that verify its
   promised outcomes. Use [BUILD-ITEM.md](BUILD-ITEM.md) for running checks,
   reusing evidence, and handling baseline failures.
   Done when required checks have run and their results are recorded,
   or unavailable checks are explicitly reported.

3. **Decide.** Accept only when every item is complete, every required outcome
   has passing evidence, and all required checks pass. Task checkboxes alone
   are not evidence. Otherwise leave the slice unaccepted and report it as
   incomplete or partly verified, naming failed or missing evidence.
   Done when acceptance or the remaining verification gaps are recorded.
