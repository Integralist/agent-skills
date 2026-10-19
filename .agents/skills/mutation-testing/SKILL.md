---
name: mutation-testing
description: >-
  Check whether a test suite catches behaviour changes by running mutation
  tests. Use when the user asks about mutation testing, surviving mutants,
  mutation scores, or whether tests would catch a regression.
metadata:
  model-tier: moderate
---

# Mutation Testing

Make small, deliberate changes to production code and check whether the tests
notice, to find real gaps in what the tests assert rather than to chase a
score. For Go, use the go-testing skill for test style, contracts, and
commands, and take the mutation tool and its syntax from the project's
configured runner or docs.

1. **Pick a narrow scope:** one package, function, or behaviour. Read its
   contract and existing tests. Done when each mutant will have a clear owner.
2. **Prove the baseline** with the repo's documented test command for that
   scope. Results mean nothing until the unmodified tests pass, so diagnose a
   failure first. Done when the baseline passes.
3. **Choose the method.** Use a mutation runner the project already
   configures, following its docs and keeping its target and test command
   scoped, without inventing flags or trusting every generated mutant. With
   no runner, ask before installing one; for a small investigation, make a
   few temporary behaviour-changing edits by hand. Done when the mutants are
   run.
4. **Check each result.** Confirm the test command actually ran. A mutant is
   caught when a relevant test fails because an observable contract changed,
   and survives when the tests pass. Build errors, runner errors, and
   timeouts are inconclusive, not caught. Done when every mutant is caught,
   survived, or inconclusive.
5. **Classify survivors.** Exclude, with a reason, mutants that preserve
   behaviour (equivalent) or fall outside the supported contract, and rerun
   flaky or infrastructure-dependent ones before deciding. Done when each
   survivor is a real gap or an excluded one.
6. **Close real gaps.** For a reachable, behaviour-changing survivor, add or
   improve a test through the public contract that asserts the missing
   behaviour, and prove it fails against the mutant and passes against the
   original. Keep distinct contract checks, and never weaken tests or change
   production behaviour just to raise the score. Done when each real gap has
   a test that kills its mutant.
7. **Restore and verify.** Let the runner restore its changes, or revert only
   your temporary edits, keeping every pre-existing working-tree change.
   Inspect the diff and rerun the baseline. Done when the tree holds only
   intended changes and the baseline passes.

**Report** the scope and commands, then counts of caught, survived, excluded,
and inconclusive mutants. Give the score as caught ÷ (caught + survived),
stating that denominator and the exclusion rule, labelled as your calculation
if the runner uses another formula, or N/A when the denominator is zero. Name
the meaningful survivors and the behaviour each exposed, and end with the
baseline result and whether every temporary mutation was restored.
