# Writing guide

Write plainly and keep instructions proportional to the decisions they guide.

**Shape.** Use short paragraphs with bold labels, each doing one job. Give one
default path and only the exceptions that matter. Number ordered steps
sequentially, 1, 2, 3. State completion conditions where a handoff or decision
would otherwise be ambiguous, rather than appending them to every step.

**Human-first entry point.** Keep `SKILL.md` direct and focused on the purpose,
scope, core workflow, handoffs, key decisions and gates, and deliverable. A
human should understand the moving parts and feel comfortable maintaining the
workflow after one pass. Put specialized procedures, schemas, and templates in
concise references for readers and agents who need those details. Do not turn
the entry point into an empty index; explain the core coordination.

**Rules.** State the behaviour you want. Keep prohibitions for hard guardrails
and pair them with the safe alternative. Explain why where it helps the agent
handle an unlisted case. Write each rule once; cut redundant instructions,
duplicates, and facts cheaply discoverable from code, configuration, or
`--help`. Preserve unwritten conventions and gotchas. Keep small, stable facts
inline when extracting them would only add a read.

**Size.** When rewriting agent-facing instructions, measure combined UTF-8
bytes before and after: the main file plus all its references. Count moved
content once. Default to a net reduction; if preserving behavior requires more
text, explain why and get the user's approval before editing. Do not move rules
to references just to make the entry point look shorter.

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

**Pointers and handoffs.** Link named files and sections to exact targets;
name structures accurately and avoid “above” or “below” unless unique and
immediate. Load references before use. For cross-skill handoffs, name the
trigger, completed prerequisites, and exact resume step; preserve direct-
invocation behavior.
