---
name: grepai
description: >-
  Search code by meaning with grepai. Use when searching by intent or concept
  rather than exact text, such as "where is rate limiting implemented" in a
  codebase whose naming you don't know, or when tracing a function's callers
  across a large codebase.
metadata:
  model-tier: trivial
---

# grepai

Find code by what it does rather than what it's called: concepts such as
"authentication flow" or "error recovery logic", code in an unfamiliar
codebase, and the callers of a function. For exact text or a regex, use `rg`.

**Install.** If `which grepai` finds nothing, run
`brew install yoanbernabeu/tap/grepai`. `grepai -h` lists the subcommands.

```bash
grepai init                        # set up the project
grepai watch                       # start the indexing daemon
grepai search "error handling"     # search by meaning
grepai trace callers "Login"       # find who calls a function
```
