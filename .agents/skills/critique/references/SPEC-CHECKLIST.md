# Spec and Gherkin Quality Checklist

Apply these checks only when critiquing a specification (`spec.md`), a living
feature (`*.feature`), or a change involving acceptance criteria or
`docs/specs/`.

## Review lenses

When subagents are available and the spec introduces or changes behaviour, run
two read-only reviewers in parallel using
[SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md); otherwise run
both passes in sequence.

1. **Product-voice reader (context-isolated).** Give this reviewer only the
   spec, root `GLOSSARY.md` (or `CONTEXT.md`),
   [voice-product](../../voice-product/SKILL.md),
   [CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md), and
   [SPEC-GUIDE.md](../../to-spec/references/SPEC-GUIDE.md). Omit code,
   research, and `intent.md` so blind spots show clearly. Check:
   - A fresh reader can identify the actor, action, permissions, observable
     outcome, and open decisions without decoding shorthand.
   - Necessary technical terms and component roles are explained at first use;
     existing responsibilities are distinct from proposed changes.
   - Prose, titles, and Gherkin steps are short, active, and concrete without
     weakening exact fields, codes, timing, or guarantees. Flag repeated
     explanations, defensive process disclaimers, or near-duplicate scenarios
     that belong in a `Scenario Outline`.
   - Testing boundaries and stand-ins stay in Testing Seams, executable setup
     stays in the plan, and deployment exclusions stay in Out of Scope rather
     than leaking into acceptance scenarios.
2. **Invariants, duplication, and accuracy reviewer (full context).** Read the
   spec alongside `intent.md` (or preserved source), `docs/adr/`, touched
   code, owning `docs/specs/*.feature` files, and
   [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md). Check:
   - **Missing invariants:** For each `Rule`, check happy path, authorization
     and refusal precedence, empty or boundary values, duplicate or expired
     actions (idempotency and timing), and partial failure, concurrency, or
     rollback.
   - **Gherkin structure:** Declarative system boundaries (not UI clicks or
     internal helper calls), one behaviour per scenario (split `"and then
     also"`), concrete observable `Then` steps, preconditions in `Given` (not
     `When`/`Then` in `Background`), and each `Rule` matching its child
     scenarios.
   - **Duplicate behaviour across scenarios and files:** Compare every new or
     edited scenario against the rest of the spec and existing
     `docs/specs/*.feature` files. Flag behaviour that overlaps an existing
     scenario under different wording; propose modifying or extending the
     owning scenario or `Scenario Outline` instead of adding a duplicate.
   - **Local verification:** For runnable applications, Testing Seams identifies
     the application entrypoint, real layers and infrastructure, mocked
     upstreams, contract sources/conformance checks, important failure cases,
     and live-service exclusions or agreed exceptions.
   - **Contract and delta coverage:** Every source requirement and open
     question is accounted for; Behavioural Delta pins the baseline commit and
     keeps `ADDED`, `MODIFIED`, and `REMOVED` accurate.

## Evidence bar

Quote the exact passage or scenario for every finding and name the concrete
ambiguity, overlap, or missing invariant. Drop pure style preferences and
speculative cases outside scope.
