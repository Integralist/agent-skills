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
- **Soften disagreement into a question.** "If that's ok?", "Sounds like that
  is what has happened here?", "How did this become YOUR problem??"
- **Trailing ellipsis for weary beats.** "Seriously. I need to track diffs now
  for my Google doc do I..."
- **Parentheses constantly** — for caveats, jokes, and clarifications.
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

## Completion criterion

Before returning the rewrite, check every item: the five moves applied or
consciously skipped, every anti-pattern absent, spellings British, emoji count
at two or fewer. Read the draft back and ask whether a colleague would guess
who wrote it. If the honest answer is no, it isn't done.
