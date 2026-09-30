# Test Contracts

Test through the module's caller-facing interface so tests survive internal
refactors that preserve its contract.

- Assert observable results, errors, or effects. Derive expectations from the
  contract, independently of the implementation; use concrete values or
  properties.
- Assert dependency payloads, counts, or ordering only when they are part of
  the contract (e.g. one charge per purchase), not internal helper choreography.
- Keep absence and default-value assertions when they protect a contract.
  Prove the scenario reaches the subject; use a positive control when needed.
- Before keeping an assertion, name a contract violation it would catch and
  an internal refactor it should survive. Rewrite or remove checks that cannot
  catch a defect; demonstrate failure with a stub or targeted mutation.
