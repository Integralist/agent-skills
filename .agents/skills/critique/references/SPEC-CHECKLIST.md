# Spec and Gherkin Quality Checklist

Apply only when critiquing a specification (`spec.md`), living feature
(`*.feature`), or change involving acceptance criteria or `docs/specs/`.

## Two review lenses

Run both lenses in sequence when already executing inside a review subagent;
at top level for large behaviour changes, you may run them as two parallel
read-only subagents per
[SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md).

1. **Newcomer reader (spec-only lens):** Read only the spec, root
   `GLOSSARY.md` (or `CONTEXT.md`),
   [voice-product](../../voice-product/SKILL.md),
   [CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md), and
   [SPEC-GUIDE.md](../../to-spec/references/SPEC-GUIDE.md)—ignoring code,
   research, and `intent.md` so blind spots surface:
   - Can a reader unfamiliar with the repo spot actor, action, permissions,
     observable outcome, and open decisions without decoding shorthand?
   - Are technical terms and component roles explained once at first use, with
     existing responsibilities clearly separated from proposed changes?
   - Is prose plain and concise without weakening exact fields, codes, timing,
     or guarantees? Flag repeated explanations, defensive process disclaimers,
     or near-duplicate scenarios that belong in a `Scenario Outline`.
   - Do testing boundaries stay in Testing Seams, setup commands in the plan,
     and exclusions in Out of Scope rather than leaking into scenarios?
2. **Invariants, duplication, and accuracy (full-context lens):** Compare the
   spec against `intent.md` (or preserved source), `docs/adr/`, touched code,
   owning `docs/specs/*.feature` files, and
   [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md):
   - **Invariants:** Per `Rule`, check happy path, auth/refusal precedence,
     empty/boundary inputs, duplicate/expired actions (idempotency/timing),
     and partial failure, concurrency, or rollback.
   - **Gherkin quality:** Declarative system boundaries (not UI clicks or
     internal helpers), one behaviour per scenario, concrete observable `Then`
     steps, preconditions in `Given`, and each `Rule` matching its scenarios.
   - **No duplicate behaviour:** Compare new/edited scenarios against the rest
     of the spec and `docs/specs/*.feature`; propose extending the owning
     scenario or `Scenario Outline` rather than adding overlapping copies.
   - **Local verification & delta:** For runnable apps, Testing Seams names
     entrypoint, real layers/infra, mocked upstreams, contract conformance,
     failure cases, and live-service exclusions/exceptions. Every source
     requirement and open question is covered, and Behavioural Delta pins the
     baseline commit with accurate `ADDED` / `MODIFIED` / `REMOVED` groups.

Quote the exact passage or scenario for every finding; drop style nits and
out-of-scope speculation.
