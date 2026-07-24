---
name: clarify
description: >-
  Elicit and pin down the user's intent before starting work. Use when a
  request is too vague to act on, when another skill hits a vague request and
  needs to clarify it, or when the user says "help me with this", "I need
  something", "let's work on...", or /clarify.
---

# Clarify

Clarify the user's intent before acting.

## Elicit

Prompt the user for these five fields in one structured interaction:

- **Audience:** Who is this for?
- **Goal:** What do they need?
- **Context:** What should the agent know?
- **Constraints:** What are the boundaries?
- **Format:** What should the output look like?

Skip any field already provided in the conversation; use the existing answer
and ask only for what is missing.

## Confirm and proceed

Restate the completed fields back to the user, then continue with the task.
