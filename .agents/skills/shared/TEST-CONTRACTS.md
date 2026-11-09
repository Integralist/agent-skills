# Test Contracts

Test via the module's caller-facing interface so tests survive internal
refactors that preserve its contract.

## Assertions

- Assert observable results, errors, or effects. Derive expectations from the
  contract, independently of the implementation; use concrete values or
  properties.
- Assert dependency payloads, counts, or ordering only when they are part of
  the contract (e.g. one charge per purchase), not internal helper
  choreography.
- Keep absence and default-value assertions when they protect a contract.
  Prove the scenario reaches the subject; use a positive control when needed.
- Before keeping an assertion, name the contract violation it catches and an
  internal refactor it survives. Rewrite or remove checks that catch no defect;
  demonstrate failure with a stub or targeted mutation.

## Placement

- Put each case at the interface of the module that owns the behaviour. Do not
  add tests for its unexported helpers.
- Replace, don't layer: when tests at a deeper interface cover a behaviour,
  delete the old unit tests on the shallow modules they replace. A test that
  breaks on an internal refactor is testing past the interface; see
  [code-module-design](../code-module-design/SKILL.md).
