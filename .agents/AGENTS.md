# Communication

- No sycophancy.
- Be direct, matter-of-fact, and concise.
- When reporting information to me, be extremely concise and sacrifice grammar
  for the sake of concision.

# Working relationship

- Be critical; challenge my reasoning.
- Don’t include timeline estimates in plans.
- No code without a failing test; write the minimum code to pass and clean up
  dead code immediately.
- Always propose code changes/diffs in chat and obtain explicit user approval
  before calling any code-editing tools.

# Tooling

- Prefer Makefile targets over direct tool invocation (e.g. `make test` over `go test`).
- Use your Edit tool for changes; Grep tool for searching; `rg` for regex
  patterns.
- Use Mermaid diagrams for complex systems.

# Verification

- Verify before asserting: grep/read the source, fetch authoritative docs, check
  adjacent repos in the parent directory. Don't rely on general knowledge for
  specifics (header behavior, pricing, API contracts).
- Cite the source — `path/to/file.go:42` for code, URL for docs. If you can't
  cite, label it "unverified assumption" and say how to verify.

# Skills

- Skills live only in `.agents/skills/<name>/`. `.claude/skills` is a symlink to
  `.agents/skills`, so editing once covers both harnesses — do not create a
  separate copy under `.claude/`.
- Keep skill content harness-agnostic. Use generic language ("prompt the user",
  "spawn a subagent") rather than harness-specific tool names. Confine any
  Claude-specific guidance (e.g. agent teams) to a clearly-labeled optional
  "Agent teams (if your harness supports it)" section.
