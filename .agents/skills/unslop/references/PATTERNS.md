# Patterns to remove

Read this before editing the target. Remove or replace the patterns below
without changing meaning or intended tone.

## Content

- **Puffery and promotion:** "pivotal moment", "testament to", "evolving
  landscape", "indelible mark", "nestled", "vibrant", "groundbreaking",
  "must-visit". State what happened in neutral words.
- **Superficial -ing tails:** "…, highlighting", "ensuring", "reflecting",
  "showcasing". Delete them or support them with a source.
- **Vague attribution and name-dropping:** "Experts believe", "Some critics
  argue", or lists of outlets. Name one source and say what it said, or cut
  the claim.
- **Formulas:** "Despite challenges… continues to thrive", "The future looks
  bright". Replace them with specific facts or plans.

## Language

- **AI vocabulary:** additionally, crucial, delve, enduring, enhance, foster,
  garner, interplay, intricate, landscape, pivotal, showcase, tapestry,
  testament, underscore, vibrant.
- **Fancy words for plain ones:** "serves as" or "boasts" for "is" or
  "has"; utilize, leverage, facilitate, numerous, and "in the event that"
  instead of use, use, help, many, and if.
- **Abstract metaphor nouns:** substrate, wedge, vector, locus, nexus,
  primitive, harness, surface (as in "API surface"), bedrock, scaffolding,
  paradigm, gold-plating, ratchet, evacuate (meaning move code), endgame,
  north star, flywheel. Use concrete words: substrate → base, wedge in → add,
  gold-plating → more than the job needs, ratchet → the mechanism's name or
  "a limit that only tightens".
- **Constructions:** "not just X, but Y"; ideas forced into threes; synonym
  cycling (choose one name and repeat it); false ranges ("from X to Y" when
  there is no real scale between them).
- **Filler:** change "in order to" to "to", "due to the fact that" to
  "because", cut "it is important to note that", and reduce stacked hedges
  such as "could potentially possibly" to "may".

## Plain speech

- **Name the mechanism, not a feeling.** "SQL you can read" names a feeling;
  "`.toSQL()` returns the exact string sent to the database" names the
  mechanism. If a sentence cannot become a concrete instruction, fact, or
  number, or could appear unchanged in another project's docs, cut it.
- Keep one idea per sentence. Split or remove sentences that make readers
  backtrack.
- Prefer active voice ("the compiler validates queries" rather than
  "queries are validated"). Passive is fine when the actor is unknown or
  does not matter.
- Prefer strong verbs over adverbs: replace "significantly improves" with
  the measured change.

## Style and chatbot artifacts

- Do not use em dashes. End the sentence or start a new one; parentheses and
  en dashes only trade one tell for another.
- Use colons only before a list or example, not as mid-sentence connectors.
- Use bold only when it earns its place. A bold label that restates its line
  ("**Performance:** Performance improved…") should become prose. A bold
  lead-in that names the item and adds detail ("**Schema in TypeScript.**
  Tables live in one file.") is fine.
- Use sentence-case headings, straight quotes, and no decorative emoji in
  headings or bullets.
- Remove chatbot artifacts such as "I hope this helps!", "Let me know if…",
  "Certainly!", "Great question!", "You're absolutely right!", "Found the
  smoking gun!", and knowledge-cutoff disclaimers. Answer directly.
