# Before a False-Positive Verdict

A rejection is a claim too, so support it with evidence. Read this checklist
before assigning `FALSE POSITIVE`; confirm which checks apply to the finding.

- **Conditional flow:** `buf[length-4]` is safe if the path runs only when
  `length > 12`.
- **Defensive code:** A check followed by a guarded operation may be a
  defense; confirm the check actually prevents the condition.
- **Bounds arithmetic:** If `size >= MIN` and `MIN >= header`, then
  `size - header` cannot underflow.
- **TOCTOU:** The checked value must be able to change before use for a
  time-of-check/time-of-use issue to exist.
- **Concurrency:** A race cannot exist in single-threaded setup or while the
  relevant lock is held.
- **API contract:** Some APIs bound their own writes or manage their own
  memory.
- **Defense in depth:** A failed secondary layer is not critical when a
  primary control holds, such as token cleanup failing while tokens are
  single-use.

Verify every instance, even when similar code was vulnerable elsewhere.
Run the full workflow even when the fix looks cheap: fixing an impossible bug
still churns code. Reach a verdict before any fix, whoever raised the finding.
