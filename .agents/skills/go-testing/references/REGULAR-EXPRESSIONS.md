# Regular Expression Tests

Protect the behaviour the regex implements, not the pattern's spelling.

**Production behaviour.** Exercise the production pattern, flags, and input
handling through its owning public API rather than compiling a copied
pattern in the test.

**Cases.** Cover accepted inputs, rejected near-misses, and relevant
boundaries: empty input, extra prefixes/suffixes, length limits,
whitespace/newlines, case, and Unicode. Choose distinct contract boundaries
rather than every combination.

**Results.** Assert the validation result, extracted fields, or replacement
output, not just whether the regex matched.

**Whole-input validation.** `regexp.MatchString` and `re.MatchString` report
whether any substring matches, not whether the entire input matches. When
the contract requires the entire input to conform, test rejection of both
an invalid prefix and an invalid suffix around an otherwise valid value.
For a digits-only validator, `"123"` must pass; `"abc123"` and `"123abc"`
must fail. Testing only `"123"` and `"abc"` misses an unanchored pattern.
Preserve substring matching when the contract intentionally searches,
extracts, or replaces matches within longer text.

**Dynamic patterns.** When the public API accepts patterns, test invalid
syntax and the error returned to the caller.
