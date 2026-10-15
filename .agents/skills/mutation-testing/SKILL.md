---
name: mutation-testing
description: >-
  Evaluate whether a test suite detects behavior changes by running mutation
  tests. Use whenever the user asks about mutation testing, surviving mutants,
  mutation scores, or whether tests would catch a regression; for Go projects,
  use this alongside go-testing.
metadata:
  model-tier: complex
---

# Mutation Testing

Mutation testing makes small, deliberate changes to production code and checks
whether tests detect them. Use it to find meaningful gaps in test behavior,
not to maximize a score.

## Workflow

1. **Choose a narrow scope.** Identify the package, function, or behavior under
   test. Read its contract and existing tests. Prefer a small scope so each
   mutant has a clear owner and the run stays actionable.

2. **Prove the baseline.** Run the repository's documented test command for
   that scope before mutating code. If the baseline fails, diagnose that first;
   mutation results are not interpretable until the unmodified tests pass.

3. **Choose the mutation method.** Reuse a mutation runner already configured
   by the project, following its local documentation. Keep its target and test
   command scoped. If no runner is available, ask before installing one; for a
   small investigation, apply a few temporary, behavior-changing edits by
   hand. Do not invent runner flags or assume every generated mutation is
   valid.

4. **Check each result.** Confirm the test command actually ran and inspect
   its output before counting a mutant caught. A mutant is caught when a relevant
   test fails because an observable contract changed. A passing test run means
   the mutant survived and needs investigation. Build errors, runner errors,
   and timeouts are inconclusive—not evidence that tests caught the mutant.

5. **Classify survivors.** Decide whether each survivor is reachable and
   changes required behavior. Treat behavior-preserving (equivalent) mutations
   and mutations outside the supported contract as excluded, with a reason.
   Rerun flaky or infrastructure-dependent outcomes before classifying them.

6. **Strengthen tests for real gaps.** For a reachable, behavior-changing
   survivor, identify the missing observable assertion. Add or improve a test
   through the public contract, then prove it fails against that mutant and
   passes against the original implementation. Preserve distinct contract
   checks; do not weaken tests or change production behavior solely to raise
   a score.

7. **Restore and verify.** Let the mutation runner restore its changes, or
   revert only the temporary edit you made. Preserve all pre-existing working
   tree changes. Inspect the diff and rerun the baseline tests after restoration.

## Go Projects

For Go code, load [`go-testing`](../go-testing/SKILL.md) for test contracts,
style, and project test commands. Run mutations against the smallest relevant
package or function, then use that skill's public-interface and observable
behavior guidance when closing a real test gap. Keep Go-specific tool
selection and command syntax in the project's configured runner or docs rather
than assuming a particular mutation CLI.

## Report

Summarize the scope and commands, then report counts for caught, survived,
excluded, and inconclusive mutants. Calculate the score as caught / (caught +
survived), state that denominator and exclusion rule, and label it as your
calculation if the runner uses another formula. Report N/A when the denominator
is zero. Name meaningful survivors and the missing behavior each exposes. End
with the baseline test result and whether temporary mutations were fully
restored.
