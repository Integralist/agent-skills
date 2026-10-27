---
name: acp
description: Approve the current change, commit it to main, and push it to origin.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

# Approve, Commit, Push

Treat invoking `/acp` as explicit approval to commit the current intended
changes on `main` and push them to `origin/main`. Use the commit skill for
staging and commit-message rules. Stage only the intended files; if moving the
changes to `main` is unsafe or ambiguous, stop and ask.
