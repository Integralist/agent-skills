# False Positive Patterns

Apply every item to each finding before issuing a `FALSE POSITIVE` verdict. A
rejection is a claim too — evidence it, don't pattern-match it.

## Checklist

1. **Trace the full validation chain.** Don't judge an isolated snippet. Trace
   backwards for every check that precedes the dangerous operation. Size and
   index operations often look unsafe but are bounded earlier in the function.
1. **Map the conditional flow.** Vulnerable-looking code may be unreachable. An
   access like `buf[length-4]` looks unsafe when `length < 4`, but if the path
   is only reached when `length > 12`, the bug is impossible. Ask: what
   conditions must hold to reach the sink, and do they rule the bug out?
1. **Distinguish defensive code from vulnerable code.** An assertion or
   validation followed by a guarded operation is defence, not a vulnerability.
   Confirm the check actually prevents the alleged condition.
1. **Confirm the data path is exploitable.** Only accept a finding with a
   confirmed source→sink path. Don't assume attacker data reaches the sink —
   prove each hop.
1. **Classify the data source's trust level.** API return values, compile-time
   constants, config, and network input have different risk. Internal storage
   set by trusted components at install/setup time is not attacker-controlled.
1. **Check the bounds arithmetic.** Look for the mathematical relationship
   between validation and use. If `size >= MIN` is checked and `MIN >= header`,
   then `size - header` cannot underflow.
1. **Prove TOCTOU, don't assume it.** A time-of-check/time-of-use bug requires
   the checked value to actually change before use. A value checked and used in
   the same scope with no external mutation is not TOCTOU.
1. **Understand the API contract.** Some APIs bound their writes or manage their
   own memory regardless of the parameters passed. Read the contract before
   claiming an overflow.
1. **Verify concurrency is possible.** No race exists in single-threaded
   initialization or under a held lock. Confirm the threading and
   synchronization model before claiming a race.
1. **Separate real impact from theoretical.** A failure with no path to code
   execution, privilege escalation, or information disclosure is an operational
   issue, not a security vulnerability.
1. **Weigh defense-in-depth against primary controls.** Failure of a secondary
   layer is not critical when a primary control still holds (e.g. token cleanup
   failing when tokens are single-use server-side).
1. **Exclude non-production paths.** Test-only, debug-only, and development code
   paths are not production vulnerabilities unless they ship and are reachable.
1. **Apply this list rigorously, not superficially.** Work every item for every
   finding. A checklist skimmed is one that lets false positives through.

## Red Flags

Recurring shapes of a false positive. Each is a prompt to re-run the relevant
checklist items.

### Pattern-based

- Flagging the validation or bounds-checking code itself
- Claiming TOCTOU without proving the value can change
- Ignoring preceding validation
- Assuming input reaches the sink without tracing it
- Confusing assertions/defensive checks with vulnerabilities
- Reporting issues in error-handling or cleanup code

### Context-blind

- Judging a snippet without the surrounding system design
- Ignoring architectural guarantees (single-writer, trusted source)
- Missing that the code is unreachable due to earlier validation
- Treating debug/test-only paths as production vulnerabilities
- Flagging issues that the framework or language already prevents

### Math / bounds

- Claiming underflow/overflow without proving the condition can occur
- Missing that conditional logic makes the vulnerable state impossible
- Reporting off-by-one without checking the loop bounds
- Claiming corruption when allocation sizes are verified sufficient

### API contract

- Claiming an overflow when the API bounds its own writes
- Reporting corruption for an API that manages memory safely
- Missing that return values are already validated by the contract
- Flagging parameter changes the API prevents from being unsafe
