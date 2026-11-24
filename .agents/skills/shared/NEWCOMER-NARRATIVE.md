# Newcomer narrative and diagram

Explain behaviour and purpose to a reader new to the repo and its parent
systems, not a file or endpoint catalogue. Aim for ~150 words of prose across
`Problem` and `Solution` (a target, not a cap—keep context needed to stand
alone).

## Narrative craft

- **Open with the system's role:** State what the project or primary system does
  in plain words up front (check `README.md`, `GLOSSARY.md`, or `CONTEXT.md`
  if needed), even when its name appears in a link.
- **Follow one concrete example:** Start `Problem` with what a person or system
  is trying to do, show where old behaviour falls short, and continue the same
  example in `Solution` to show what happens now and why it matters. Do not
  stop at an intermediate step if a later step explains the payoff.
- **Define names once, reuse consistently:** On first mention of an unfamiliar
  system, component, or term (including "key", "token", or "issuer"), add a
  short parenthetical gloss of its role in this example—expanding an acronym is
  not enough. Declare any short alias at first mention; otherwise reuse exact
  names across prose and diagram labels.
- **Scannable paragraphs:** Never pack `Problem` or `Solution` into one dense
  wall of text. Use **1–2 short, blank-line-separated paragraphs** per section
  (or up to 5 short bullets in `Solution`), keeping ~1–3 sentences per
  paragraph.
- **Problem:** Stand alone. Introduce prerequisite concepts before dependent
  terms (purpose, provider or user, and connection).
- **Solution:** One action per sentence—who changes what, where (real files,
  owners, or environments), and why. Separate setup from runtime, state what
  stays the same, and keep limits beside benefits. Claim speed, safety,
  adoption, or plans only with evidence.

## Flow diagram

Include one concise Mermaid diagram inside `Solution` using plain role labels;
omit only when no useful flow exists. Use `sequenceDiagram` for requests and
hand-offs, `flowchart` for branches or relationships, or `stateDiagram-v2` for
states. Separate setup from runtime, mark new or changed elements against
unchanged context, and include a refusal path when useful. Read and follow
[conventions-mermaid](../conventions-mermaid/SKILL.md) for syntax and layout,
and confirm diagram labels match the prose.

## Newcomer check

Reread `Problem` and `Solution` without repo memory: verify the opening
defines the primary system, paragraphs are short and separated (at most 2 per
section, no walls of text), every term and actor is defined on first use with
consistent names, and a newcomer can follow the example to see why it matters.
Revise and recheck if anything is missing.
