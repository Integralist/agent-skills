# Accept one slice

Verify only the outcomes promised by this slice, whether built from a plan
directly or a compiled task list. Use the same gate in both cases.

1. **Map the outcomes.** Read the slice's source plan and spec when present.
   Account for every milestone and acceptance criterion assigned to this slice;
   without milestones, use the task list's promised outcomes. Keep planned
   later-stage checks with their owning milestones, not current prerequisites.
   Do not defer current obligations because checks fail or are unavailable.

   Before checks, map each criterion to its owning living feature and required
   scenarios. Fill missing mappings from the agreed scope; missing coverage is
   work, not an exemption. If no feature applies, record why and identify
   equivalent executable assertions. Record evidence in
   [BUILD-ITEM.md](BUILD-ITEM.md)'s format.

   Done when the slice's required outcomes and their checks are identified.

2. **Exercise the slice.** Run project-required checks and regression checks
   that apply to the change, using documented commands. For code, test the
   implementation being delivered; do not substitute a mock for the behaviour
   under verification. External services may be mocked only when the agreed
   verification scope allows it. Record the testing boundary and any
   live-service checks not performed. Those checks block completion only when
   required by the current scope or project policy. Base external test doubles
   on authoritative contracts or independently checked fixtures, not
   assumptions from the implementation.

   Run acceptance scenarios assigned to this slice, even if there is no
   compiled boundary task. Load the canonical living feature files directly.
   Build the minimum required harness as part of the slice; a complete,
   product-wide end-to-end suite is not a prerequisite unless the slice's
   contract or project policy requires one. When adding or changing the
   harness or steps, follow the
   [acceptance-test conventions](../conventions-acceptance-tests/SKILL.md).

   Reconcile expected scenario identities and counts, including every Scenario
   Outline example row, with those executed and passed. A zero exit code, unit
   tests, structural checks, or matching totals alone do not prove acceptance
   coverage. Record each criterion's feature paths, scenario names, example
   rows, observed counts, and log references. Include Rule context when titles
   repeat.

   For non-code work with no applicable features, run the executable
   assertions and repository checks mapped in step 1. Use
   [BUILD-ITEM.md](BUILD-ITEM.md) for running checks, reusing evidence, and
   handling baseline failures.

   If checks depend on local source changes excluded from delivery, rerun
   them without those changes before accepting the slice.

   Done when required checks have run and results are recorded, or unavailable
   checks are explicitly reported.

3. **Review the delivery.** Standalone acceptance requires the review gate in
   [REVIEW-CHANGE.md](REVIEW-CHANGE.md). A coordinator may own review
   scheduling only if the caller explicitly names the active coordinator,
   slice scope, and due review gates. A historical execution log is not
   delegation. With execute-plan ownership, run the due risky-slice review here
   and leave
   whole-plan review for its final gate; acceptance checks still run per slice.
   Record whether review is satisfied or scheduled under the coordinator.

   Done when all currently due review gates pass or their gaps are recorded.

4. **Decide.** Accept only when every item is complete, every required outcome
   has passing evidence, all required checks pass, and required review evidence
   is current and resolved. Failed, missing, skipped, pending, undefined, or
   unavailable required scenarios keep the slice unaccepted. Task checkboxes
   alone are not evidence. Otherwise leave the slice unaccepted and report it
   as incomplete or partly verified, naming failed or missing evidence.

   Done when acceptance or the remaining verification gaps are recorded.
