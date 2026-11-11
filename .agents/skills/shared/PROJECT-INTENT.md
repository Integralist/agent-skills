# Project intent and request history

Keep the original request and requirement-changing history separate from the
current spec or plan, so readers can follow the proposal without a transcript.

Before drafting or revising synthesized prose, read and apply
[voice-product](../voice-product/SKILL.md) to the Overview and explanations of
clarifications and decisions. Keep original source quotations verbatim, apart
from marked redactions; never rewrite evidence to fit the voice.

**When needed.** Reuse or create `intent.md` when request evidence or history
needs a preserved home. If a stable source already preserves it, link that
source instead of duplicating it. Do not create an empty artifact or add one
during a wording-only revision. Extract embedded history only when that change
is within the user's approved scope.

**Evidence and decisions.** Preserve original wording as quotations or
fixed-revision links; redact secrets and mark redactions. Record later
clarifications and decisions separately, with their source, date when known,
and whether they are proposed, agreed or superseded. Do not rewrite earlier
evidence to match the latest decision or infer approval from publication.

**Ownership.** Intent records what was asked and how understanding changed.
The current proposed contract belongs in `spec.md`, or plan milestones when
there is no spec. Durable architectural rationale belongs in ADRs; link it
rather than maintaining another decision record here.

**Storage.** Use one home in the project's selected mode:

- **On disk:** Write `intent.md` beside the spec or plan and index it in the
  project README, following [PROJECTS-README.md](PROJECTS-README.md).
- **GitHub:** Publish `intent.md` as its own Root Issue Artifact, following
  [GITHUB-ISSUES.md](GITHUB-ISSUES.md). Index it on the Root Issue and use its
  artifact URL in spec/plan links, not a local-file link or project copy.

**Handoff check.** Read preserved intent before drafting or reviewing the spec
and plan. Check omissions, contradictions and unexplained exclusions; every
open question is answered or carried forward with its unresolved status.
Distinguish agreed requirements from proposed responses to risk. When agreed
intent changes, recheck affected spec criteria and plan milestones within the
existing approval gates. If evidence is unavailable, record the gap, not a
reconstructed quotation.

## Intent template

````markdown
# {Feature} — Intent

| Field | Value |
| --- | --- |
| Status | {Draft or explicitly agreed status} |
| Author | {request originator, or unknown} |
| Created | {capture date} |

## Overview

{What is wanted, why, who and which systems are affected, constraints and
exclusions. Use the originator's terms; do not duplicate acceptance criteria.}

## Open Questions

- {Unresolved choice, or "None"}

## Original Request

{Verbatim evidence or fixed-revision source links; mark any redactions.}

## Clarifications and Decisions

- {Source and date when known; what changed; proposed/agreed/superseded status}
````
