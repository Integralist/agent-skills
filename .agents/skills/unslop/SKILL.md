---
name: unslop
description: >-
  Rewrite prose, documentation, PR descriptions, or copy to remove
  AI-generated writing patterns, puffery, and machine cadence. Use when asked
  to remove AI tells, humanize text, or unslop something.
argument-hint: "[file path | pasted text | (empty for latest message)]"
metadata:
  model-tier: trivial
---

# Unslop

Rewrite text so it reads as written by a person: strip the patterns below,
then add the voice that removing them leaves missing. Keep the meaning and the
intended tone. When a voice skill is also in use, its rules win where they
conflict with these.

1. **Pick the target.** With no argument, take your latest message in this
   session. With pasted text, take that. Rewrite both in chat and write
   nothing to disk. With a file path, read the whole file, propose the diff
   in chat, and write it only once the user approves. Ask when the target is
   unclear. Done when you know what you're rewriting and where it goes.
2. **Strip the patterns** listed below. Done when none are left.
3. **Add voice,** since sterile writing is as obvious as slop:
   - Have opinions: react to facts rather than listing pros and cons
     neutrally.
   - Vary rhythm. Short sentences. Then longer ones that take their time.
   - Acknowledge complexity: "impressive but also kind of unsettling" beats
     "impressive".
   - Use "I" when it fits, and let some mess in; perfect structure looks
     machine-made.
   - Be specific: not "this is concerning" but "there's something unsettling
     about agents churning away at 3am".

   Done when the text has a point of view and an uneven rhythm.
4. **Audit.** Ask "what makes this obviously AI-generated?" and fix what you
   find. Done when the answer is nothing.

## Patterns

**Content.**

- **Puffery and promotion:** "pivotal moment", "testament to", "evolving
  landscape", "indelible mark", "nestled", "vibrant", "groundbreaking",
  "must-visit". Say what happened, in neutral words.
- **Superficial -ing tails:** "…, highlighting", "ensuring", "reflecting",
  "showcasing". Delete them, or back them with a source.
- **Vague attribution and name-dropping:** "Experts believe", "Some critics
  argue", a list of outlets. Name one source and say what it said, or cut.
- **Formulas:** "Despite challenges… continues to thrive", "The future looks
  bright". Replace with specific facts or plans.

**Language.**

- **AI vocabulary:** additionally, crucial, delve, enduring, enhance, foster,
  garner, interplay, intricate, landscape, pivotal, showcase, tapestry,
  testament, underscore, vibrant.
- **Fancy words for plain ones:** "serves as" or "boasts" for "is" or "has";
  utilize, leverage, facilitate, numerous, "in the event that" for use, use,
  help, many, if.
- **Abstract metaphor nouns:** substrate, wedge, vector, locus, nexus,
  primitive, harness, surface ("API surface"), bedrock, scaffolding,
  paradigm, gold-plating, ratchet, evacuate (for moving code), endgame, north
  star, flywheel. Use the concrete word: substrate → base, wedge in → add,
  gold-plating → more than the job needs, ratchet → the mechanism's name or "a
  limit that only tightens".
- **Constructions:** "not just X, but Y"; ideas forced into threes; synonym
  cycling (pick one name and repeat it); false ranges ("from X to Y" with no
  real scale between them).
- **Filler:** "in order to" → "to", "due to the fact that" → "because", "it is
  important to note that" → cut, and stacked hedges ("could potentially
  possibly") → "may".

**Plain speech.**

- **Say what it does, not how it feels.** "SQL you can read" names a feeling;
  "`.toSQL()` returns the exact string sent to the database" names the
  mechanism. If a sentence can't become a concrete instruction, fact, or
  number, or could appear unchanged in another project's docs, cut it.
- **One idea per sentence.** If the reader has to backtrack, split it or drop
  clauses.
- **Active voice:** "queries are validated" → "the compiler validates
  queries". Passive is fine only when the actor is unknown or doesn't matter.
- **Strong verbs over adverbs:** "significantly improves" → the measured
  change.

**Style.**

- **No em dashes.** End the sentence or use a comma; parentheses and en dashes
  just trade one tell for another.
- **Colons** only before a list or example, not as a mid-sentence connector.
- **Bold** only where it earns it, not every proper noun. A bold label that
  restates its line ("**Performance:** Performance improved…") becomes prose;
  a bold lead-in that names the item and adds new detail ("**Schema in
  TypeScript.** Tables live in one file.") is fine.
- **Sentence-case headings,** straight quotes, and no decorative emoji in
  headings or bullets.

**Chatbot artifacts:** "I hope this helps!", "Let me know if…",
"Certainly!", "Great question!", "You're absolutely right!", "Found the
smoking gun!", and knowledge-cutoff disclaimers. Remove them and answer
directly.
