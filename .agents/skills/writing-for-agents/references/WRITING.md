# Writing guide

Write plainly and keep instructions proportional to the decisions they guide.

**Shape.** Use short paragraphs with bold labels, each doing one job. Give one
default path and only the exceptions that matter. Number ordered steps
sequentially, 1, 2, 3. State completion conditions where a handoff or decision
would otherwise be ambiguous, rather than appending them to every step.

**Rules.** State the behaviour you want. Keep prohibitions for hard guardrails
and pair them with the safe alternative. Explain why where it helps the agent
handle an unlisted case. Write each rule once; cut redundant instructions,
duplicates, and facts cheaply discoverable from code, configuration, or
`--help`. Preserve unwritten conventions and gotchas. Keep small, stable facts
inline when extracting them would only add a read.

**Examples.** Add a template or a BAD/GOOD pair when it resolves real ambiguity,
not for every output. Prefer concrete artifacts and verbs:

```txt
BAD:  Helps with documents.
GOOD: Create, edit, and analyze .docx files. Use when ...
```

**Vocabulary.** Prefer familiar words over coined labels. A strong term such
as "relentless", "frontier", or "tracer bullet" can carry a useful approach;
define it once when needed, then reuse it rather than its explanation.

**Portability.** Name other skills in plain words and link to their files,
rather than relying on slash-command syntax. Give explicit commands instead
of harness-specific context injection. Judge the total required reading and
tool work, rather than the length of `SKILL.md` alone.
