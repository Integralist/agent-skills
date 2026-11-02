---
name: wait-what
description: Stop. That last message did not land — re-pitch it.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

The last message did not land. Re-pitch it with a little context, in
ASD-STE100 Simplified Technical English, using the domain terms in
`GLOSSARY.md`.

If only legacy `CONTEXT.md` exists, use it and show the user a `⚠️` warning to
rename it to `GLOSSARY.md`.
