# Rewrite workflow

Preserve agreed behaviour while changing its wording and location.

1. **Inventory.** Read the skill and every file it links to, then search for
   callers and links to its sections. Identify purpose, scope, inputs,
   defaults, approval gates, deliverables, and required or conditional reads.
   Use the user's priorities to compare with your inventory; look up facts
   yourself and ask only about decisions.

2. **Settle the changes.** Summarise agreements and give each difference a
   disposition and reason: retain inline, extract into a local reference,
   transfer to its owning workflow or shared document, or delete. For a rule
   guarding against a past error, compare representative runs with and
   without the rule before proposing deletion. A passing run with the rule
   present is not evidence it is unnecessary. If testing is unavailable,
   report the gap and retain the guard unless the user accepts its removal.

3. **Place the rules.** Use the writing-for-agents guidance to draft the
   agreed rewrite. Logic belonging to another workflow goes there, not into
   the skill's local references. Before transferring it, check the destination
   has not already decided against owning it. Repoint callers and section
   links to the new home. Local references need explicit loading conditions
   in `SKILL.md`; keep decisions and approval gates visible in the main file.
   Apply only after the user approves the proposal.

4. **Verify.** Compare the written skill and relocated rules with every
   agreed disposition. Check that retained behaviour is loaded before the
   action it governs, conditional reads have clear triggers, and caller paths
   and section anchors still resolve. Exercise representative modes, missing
   inputs, approval gates, and conditional reads, comparing the old and new
   behaviour where relevant. Mark unrun checks as verification gaps; a short
   entry point or an existing reference file does not prove preservation.
