---
name: writing-for-agents
description: >-
  MANDATORY for any work on agent-facing documents. Load this before creating
  or editing a skill, or modifying AGENTS.md, CLAUDE.md, or GEMINI.md.
metadata:
  model-tier: moderate
---

Write agent documents — skills, AGENTS.md, anything an agent reads — so the
user can read them in one pass. A document clear to the user is clear to the
agent. Be concrete about the outcome and leave the method to the agent: it
thinks well, and a narrow rule makes it follow the letter and skip what you
hoped it would notice. For skill frontmatter, read
[SKILL-MECHANICS.md](SKILL-MECHANICS.md).

**Shape.**

- The first paragraph says what the document does in total.
- Then short paragraphs, each led by a bold label and doing one job.
- One default path per decision; name the exception only where one exists.
- Each rule once. Give the reason inline where it helps the agent handle cases
  you didn't list.
- One template in a code block for any output; one BAD/GOOD pair if a rule is
  subtle.
- Put detail that only some cases need in a separate file, and link to it.
- Number ordered steps 1, 2, 3, so steps can be referenced by number.
- End each step on a clear "Done when…".

**Be concrete.** Name specific artifacts and verbs, especially in descriptions,
which stay loaded every turn. Lead with what the document is, then "Use when…"
with one trigger per distinct case. A description decides when the skill
loads, not how it runs. The body carries the method once the skill loads, so in
the description it only costs tokens and can mismatch the body after an edit.

```txt
BAD:  Helps with documents.
GOOD: Create, edit, and analyze .docx files. Use when …
```

**Prompt the positive.** State the behaviour you want. A prohibition puts the
unwanted idea into context and makes it more likely. Keep a prohibition only
for a hard guardrail, and pair it with what to do instead.

**Leading words.** One strong word the model already knows can carry a whole
behaviour: _relentless_, _frontier_, _tracer bullet_. Define it once, then
repeat the word, not the explanation. Prefer an existing word to a coined one.

**Every line costs.** Each rule, file load, and command spends tokens and time
on every run. Cut rules the agent follows by default, facts it can cheaply look
up (a config, `--help`, the code), and anything said twice. Keep what it can't
find by looking: unwritten conventions, the reason behind a choice, a gotcha no
config reveals. Inline small, stable facts instead of having the agent read a
file for them.

**Stay portable.** Name other skills in plain words ("use the branch skill"),
not as slash commands. Tell the agent which commands to run rather than using
syntax only some harnesses execute, such as Claude Code's `` !`cmd` `` context
injection.
