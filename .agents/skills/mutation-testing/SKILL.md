---
name: mutation-testing
description: >-
  Check whether a test suite catches behaviour changes by running mutation
  tests. Use when the user asks about mutation testing, surviving mutants,
  mutation scores, or whether tests would catch a regression.
metadata:
  model-tier: moderate
---

Check whether tests catch deliberate behaviour changes. Aim to find real gaps
in their assertions, not to chase a score. For Go, read the go-testing skill
for test style, contracts, and commands. Use the mutation tool and syntax from
the project's configured runner or documentation.

1. **Choose a narrow scope.** Pick one package, function, or behaviour. Read
   its contract and tests so every mutant has a clear owner.
2. **Prove the baseline.** Run the repository's documented test command for
   that scope. Diagnose any test error before mutating; results are meaningful
   only when the unmodified tests pass.
3. **Choose a mutation method.** Use an existing configured runner, following
   its documentation. Keep its target and test command scoped; don't invent
   flags or trust every generated mutant. If there is no runner, ask before
   installing one. For a small investigation, make a few temporary,
   behaviour-changing edits by hand.
4. **Classify each result.** Confirm the test command actually ran. A mutant
   is caught only when a relevant test fails because an observable contract
   changed. Passing tests mean it survived. Build errors, runner errors, and
   timeouts are inconclusive. Mark each mutant caught, survived, or
   inconclusive.
5. **Review survivors.** Exclude a mutant only with a reason: it preserves
   behaviour (equivalent) or falls outside the supported contract. Rerun
   flaky or infrastructure-dependent mutants before deciding. Each remaining
   survivor is a real test gap.
6. **Close real gaps.** For each reachable, behaviour-changing survivor, add
   or improve a test through the public contract. Prove it fails against the
   mutant and passes against the original. Keep distinct contract checks;
   never weaken tests or change production behaviour solely to raise the
   score.
7. **Restore and verify.** Let the runner restore its changes, or revert only
   your temporary edits. Preserve all pre-existing working-tree changes.
   Inspect the diff and rerun the baseline.

**Report.** Give the scope and commands, then counts of caught, survived,
excluded, and inconclusive mutants. Calculate the score as caught ÷ (caught +
survived), state that denominator and the exclusion rule, and label it as your
calculation if the runner uses another formula. Use N/A when the denominator
is zero. Name meaningful survivors and the behaviour each exposed. End with
the baseline result and whether every temporary mutation was restored.
