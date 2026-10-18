---
name: retro
description: >-
  Run a retrospective on a coding session to cut friction in the agent's
  environment. Use when a session ran slow, hit repeated errors, or had tool
  or context friction.
disable-model-invocation: true
metadata:
  model-tier: moderate
---

# Retro

Review a coding session and propose changes to the agent's environment
(checks, instruction files, navigation, tool access) so the same friction
doesn't recur. Follow [writing-for-agents](../writing-for-agents/SKILL.md) for
any instruction text you propose.

1. **Read the session's primary sources:** its transcript or logs on this
   machine, defaulting to the current session. Done when you've read it end
   to end.
2. **Audit it** in these categories:
   - **Automated checks:** errors a check could have caught. Read the repo's
     build and check commands first (`package.json`, `Makefile`, CI). A check
     that exists but is unwired or broken is the top finding, and a repo with
     no pre-commit hook or CI running lint, typecheck, and test is a standing
     one.
   - **Coding standards:** give a mechanical violation (syntax, banned API,
     import shape, file path) a deterministic check, and keep
     `CODING_STANDARDS.md` or review guidelines for real judgment calls.
   - **Navigation:** files that took many tool calls to find get a pointer in
     `AGENTS.md`.
   - **Context budget:** move operational rules out of `AGENTS.md` and other
     steering files into checks or review guidelines, and remove instructions
     that don't change behaviour.
   - **Tool economy:** expensive calls such as broad greps, repeated reads, or
     large shell dumps.
   - **Information access:** missing feeds that forced guessing, such as dev
     server logs or read-only third-party access.

   Done when each category has findings or is clear.
3. **Report** the findings ranked by severity, each with a concrete next
   step. Done when the user has the ranked list.

**Where things go.** Implementation is under high context pressure, so keep
its steering minimal; review gets a diff and little else, so standards and
style belong there.

- `AGENTS.md` or `CLAUDE.md`: always loaded, so mostly navigation pointers
  rather than rules.
- `CODING_STANDARDS.md`: read at review time; add navigation pointers past
  1,000 lines.
- `docs/`: reference loaded on demand through pointers.
- `skills/`: procedures or reference loaded when invoked.
