# Review a delivered change

Run the code-review skill before declaring a standalone slice or an executed
plan complete. Tests prove specified behaviour; review also checks defects,
conventions, and contract drift. Reviewers remain read-only; the caller owns
corrections and completion.

**Baseline.** Record scope before the first implementation edit: baseline
commit, initial index and working-tree state, and inherited user changes,
including new files. Keep this with the slice's existing evidence, or in the
plan's execution log. Preserve it across task commits and later invocations.
Reconstruct and verify a missing baseline from reliable history; do not
substitute the current HEAD or default-branch merge base. If the delivered
change cannot be identified, record the gap and stop short of completion.

**Delivery scope.** Build a delivery manifest covering the owned files and
hunks since that baseline: committed, staged, unstaged, and new files,
including corrections and deletions. Exclude inherited user changes and
unrelated commits. Where a file mixes ownership, use recorded before/after
content to separate the delivered delta and reconstruct its delivered state
without changing the user's checkout. If ownership cannot be separated safely,
stop and ask; never reset, stash, or discard work to obtain a reviewable tree.
Keep secrets out of snapshots and reviewer context.

**Review.** Invoke code-review with `--baseline=<commit>` and the delivery
manifest, plan/spec paths, test evidence, and exact delivered snapshot using
its [recorded execution source](../code-review/MODES.md).
Include committed and uncommitted work, not only the current working diff.
Keep source stable: no code or test edits during the review. Read all reviewer
and verifier results and confirm file and convention coverage as code-review
requires. If the owned diff is genuinely empty, record the verified empty
scope; a missing baseline or manifest is not an empty change.

**Disposition.** Resolve every verified actionable finding by correction,
explicit user acceptance or an applicable documented exception. Record the
source and scope of each acceptance or exception; higher-priority requirements
still apply. An automatic decision is not user acceptance. Material review
gaps block completion: incomplete required reviewers, uncovered files or
conventions, unresolved High security questions, and unknowns that prevent
checking a required outcome. Other unknowns remain visible in the report.
Make corrections through the caller's normal approval, scope, and commit
rules, not through the read-only reviewer. Respect the existing stop after
three failed fixes rather than looping indefinitely.

**Current evidence.** After corrections, rerun affected tests and review the
corrections, expanding the review for affected contracts and callers. Repeat
acceptance or the final audit when their evidence changes. Record the baseline,
delivery manifest, reviewed HEAD and content fingerprints for dirty/new files,
report path, coverage, finding dispositions, and unresolved questions beside
the acceptance evidence. A reviewer summary alone is not proof of completion.

**Reuse.** Reuse a prior review only when its scope, content, and applicable
requirements still match. Earlier slice reviews can supply unchanged evidence,
but the final plan review must account for the complete delivery and its
cross-slice interactions. Bookkeeping-only status and log updates do not
invalidate code evidence unless they change requirements or delivery scope;
keep them accounted for in the manifest. On resume, validate the recorded
snapshot rather than relying on checkboxes or an old clean-review claim.
