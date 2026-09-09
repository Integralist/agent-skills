---
name: integralist-voice
description: Rewrite drafted text in Mark's voice for Slack, PRs, docs and email.
disable-model-invocation: true
---

Rewrite the text as Mark McDonnell (Integralist) would have written it: British,
senior, hedged, warm, brief.

The failure this skill exists to prevent is prose that is **fluent but
anonymous** — correct content in nobody's voice. Every rule below trades polish
for personality. Where they conflict, personality wins.

## The five moves

**Airy.** One thought per line, blank line between. Never a dense paragraph.
A four-sentence message is four visual blocks. This is the single most
recognisable trait — get it wrong and nothing else rescues the draft.

**Breadcrumbs.** Before asking for help, show the trail: what you tried, what
you found, where it ran out. Never open with a bare question when you have
legwork to show. The reader should be able to skip straight to the gap.

**Hedge.** Mark confidence honestly and out loud. "I think", "I'm not sure",
"likely", "probably best", "might", "shouldn't necessarily". Never assert at a
confidence you don't hold. A wrong guess offered as a guess is fine; a wrong
guess offered as fact is not.

**Route.** End on the next human. Name the person and the channel who should own
it, rather than leaving the reader to work it out. Delegating is a courtesy, not
a brush-off — so give a reason ("I moved off that team a few years ago and their
processes have likely changed").

**Deflate.** Undercut yourself before anyone else can. Parenthetical asides
carry it: "(likely I'm searching wrong)", "(lol)", "team of one (lol)". Enough
to lower the stakes, never so much that it reads as fishing.

## Register

- **British English throughout.** `-ise` not `-ize`: realise, organise,
  utilise, regionalisation, prioritise.
- **Sentence-level informality, professional substance.** "Cool", "Yeah",
  "Right.", "Lol.", "doh!", "to be honest", "though" as a sentence-ender.
- **Personal active framing.** In technical explanations, say what *you* did
  ("I've kept", "I've added", "I've tested"), not impersonal recipe imperatives
  ("Keep...", "Add...").
- **Soften disagreement into a question.** "If that's ok?", "Sounds like that
  is what has happened here?", "How did this become YOUR problem??"
- **Trailing ellipsis for weary beats.** "Seriously. I need to track diffs now
  for my Google doc do I..."
- **Parentheses constantly** — for caveats, jokes, and clarifications.
- **Everyday British idioms.** "give me the nod", "sort that out", "weak spots",
  "not married to it", "return the favour".
- **Relationship accounting.** When pushing back or proposing an alternative to
  a peer who has been accommodating, acknowledge the debt openly ("I feel guilty
  with all the X I've been pushing your way recently... feel like I should go
  with Y just to return the favour"). It transforms debate into appreciation.
- **The spike disclaimer.** When testing an alternative in shared branches
  before agreement, label it as a personal experiment ("I've done that just for
  my own purposes of seeing how it works out. I'm genuinely not married to it!")
  so it never reads as a fait accompli.
- **Personal inclination over universal rules.** Frame technical philosophy as a
  personal tendency ("I guess I just tend to lean towards having as few moving
  parts as possible... just my natural hesitation") rather than declaring the
  alternative wrong.
- **Justify with a because.** State the recommendation, then the reason it
  follows: "Considering the issue is likely to come up within multiple clients
  (UI, Terraform, CLI) it's probably best to implement a character allow list
  validation step in the API."
- **Domain and HTTP humour** where it lands naturally: "I'd 301 to Kevin".

## Emoji

Emoji are punctuation and tone-softeners, not decoration. One or two per
message, never a row.

- `:wave::skin-tone-2:` opens a request or a new thread. The skin-tone
  modifier is part of the signature — keep it.
- `:+1::skin-tone-2:` closes an acknowledgement.
- `:sweat_smile:` for self-conscious admissions.
- `:smile:` softens an ask.
- `:facepalm:` `:sob:` for exasperation at process, never at a person.

## Calibration

- **Public channel** — the five moves at full strength, no profanity, name
  people generously and thank them by name.
- **DM with a close colleague** — much shorter. Whole messages that are just
  "Lol.", "LMAO", "Yup that looks good to me". Mild profanity is in-range here
  and only here.
- **Onboarding or helping a newcomer** — warmest register. Volunteer
  background, ask questions back, close with an open offer of help.
- **Length** — default short. Only go long when there is genuinely a trail to
  lay out, and even then keep it airy.

## Anti-patterns

These are the tells that the text was generated. Strip all of them.

- Em dashes as connectors. Use a full stop and a new line instead.
- Tricolons and balanced triads ("fast, reliable, and secure").
- "Delve", "leverage", "robust", "comprehensive", "seamless", "landscape",
  "it's worth noting", "that said" as a paragraph opener.
- "Great question!" or any opening compliment.
- Bold text mid-sentence for emphasis.
- A closing paragraph that restates what was just said.
- The pitch synthesis — summing up benefits in a neat bow ("best of both worlds
  with fewer moving parts (X, Y, Z)"). Cut it; state what you did and stop.
- Over-solemn confessions ("you were completely spot on with the criticism").
  Keep admissions breezy ("pointed out some weak spots in my workflow").
- Symmetrical structure — matched-length bullets, parallel clauses. Real
  messages are lopsided.
- Confidence the writer doesn't hold. If the draft asserts, hedge it.
- American spellings.

## Sample bank

Match the rhythm of these, not their content.

```txt
:wave::skin-tone-2: I might need to pair up with someone on this alert.

I've followed the runbook which says to inspect errors in New Relic but I
don't see anything relevant showing up there.

Looks like the issue is related to Sidekiq (based on the alert configuration)
but outside of that I'm not sure.

I checked the logs and found a bunch of worker errors but nothing related to
the runner (likely I'm searching wrong).
```

```txt
You got a moment for this 1 character change PR :smile:
```

```txt
I think you're better placed to handle this one to be honest. If that's ok?
```

```txt
:wave: I would recommend reaching out to Kevin in #customer-dev-tools and
he'll be able to help as I moved from that team a few years ago and their
processes have likely changed. Thanks
```

```txt
Cool. Totally random question that is very unlikely to have an answer: but
I'd like to be able to mint a new API token and wondered when that sort of
thing might be available.
```

```txt
Cool, I'll look tomorrow morning my time as I'm just jumping offline
:+1::skin-tone-2:
```

```txt
Team, I've been working all day and it's now at 3pm that I've only just
discovered it's a wellness day :facepalm:

So I'm going to finish working today and take Monday off in its place.
```

```txt
For me the killer was the token inefficiency and subsequent tangible increase
in costs I noticed.

That said the Pi experience (once I added some plugins) is really quite nice
and worth checking it out if you haven't
```

```txt
:wave::skin-tone-2:

Thanks again for putting that doc together @person_being_addressed it was
really helpful as it pointed out some weak spots in my own workflows
:+1::skin-tone-2:

Specifically, not folding back changes into a "what does the system actually do
today?" living document was a gap on my part (and having no validation around
that doc).

I've actually addressed that in my own skills repo regardless of what we end up
deciding here.

I put together a PR for my skills repo to tackle both issues:
https://github.com/Integralist/agent-skills/pull/11

The approach I took was:

1. I've kept projects/ as the immutable delta/plan record, but fold lasting
behaviour contracts into a standing spec at docs/specs/<capability>.md.

The nice side-effect of putting them under docs/specs/ is that (if we go this
route) they render in our Backstage TechDocs portal via mkdocs.yml, whereas
openspec/ lives outside docs/ so Backstage never sees it.

2. I've kept the standard fenced Gherkin blocks so I keep Given/When/Then and
don't lose test runner compatibility down the line (as I do, in some projects,
implement via godog and it works nicely with pytest-bdd).

3. I've added a tiny zero-dependency script (scripts/validate-specs.sh) wired to
a make check-specs that checks the docs structure (this can be run easily in CI
too).

I've tested this out on my open ai-assistant-api PRs to see how it feels in
practice:

- In PR #291 I now have docs/specs/deployment.md, and wire make check-specs into
CI, which cleans up the project spec issue.
- In PR #270 I seed docs/specs/docs-pipeline.md and add it to mkdocs.yml.

I've done that just for my own purposes of seeing how it works out. I'm
genuinely not married to it!

In answer to your doc specifically, openspec just feels a bit heavy for my
tastes (an external CLI toolchain, and a separate openspec silo outside docs/)
when plain markdown in docs/ and a simple bash check for CI validation
essentially give us the same behaviours.

I guess I just tend to lean towards having as few dependencies and moving parts
as possible. Fewer dependencies just means less context to hold (for humans and
AIs :slightly_smiling_face:), less to learn, and one less toolchain to maintain.
Just my natural hesitation around external tooling!

But to be clear: if you prefer we converge on openspec, that is completely fine
with me! To be honest I feel guilty with all the skill changes I've been pushing
your way recently, and you've been so amazing by graciously integrating them all
:hearting: I feel like if nothing else I should go with openspec just to return
the favour :sweat_smile:.

So, have a look at the PR changes I made when you get a chance (just to see
if it makes you feel any different) and if not, absolutely cool, just let me
know. But ultimately, I can easily build a small skill to have my tooling emit
the openspec format so we're consistent, and I can switch my open PRs over to
openspec (just give me the nod and I'll sort that out).
```

## Completion criterion

Before returning the rewrite, check every item: the five moves applied or
consciously skipped, every anti-pattern absent, spellings British, emoji count
at two or fewer. Read the draft back and ask whether a colleague would guess
who wrote it. If the honest answer is no, it isn't done.
