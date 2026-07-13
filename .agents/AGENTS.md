# Communication

- No sycophancy.
- Omit needless words (Strunk & White). Applies to chat *and* every artifact
  you write (docs, comments, PR/commit messages). Write the point, then cut:
  delete any word, sentence, or qualifier that survives removal without loss of
  meaning. Prefer the shorter word, active voice, one clause over two.
- In chat, default to terse: lead with the answer, drop preamble ("Sure", "Great
  question", "Let me…") and recap. Sacrifice grammar for concision — fragments
  and dropped articles are fine. No restating my question back to me. If the
  answer is a word, reply with a word.

# Working relationship

- Be critical; challenge my reasoning.
- Don’t include timeline estimates in plans.
- No code without a failing test; write the minimum code to pass and clean up
  dead code immediately.
- Always propose code changes/diffs in chat and obtain explicit user approval
  before calling any code-editing tools.
- Before displaying a long diff (more than ~40 lines), prompt me first with a
  one-line summary of what it covers and let me choose: show the full diff, or
  skip ahead to making the edits for my approval.

# Tooling

- Prefer Makefile targets over direct tool invocation (e.g. `make test` over `go test`).
- Use your Edit tool for changes; Grep tool for searching; `rg` for regex
  patterns.
- Use Mermaid diagrams for complex systems.
- Write commit messages to a temp file and `git commit -F <file>`. Never pipe
  via heredoc (`git commit -F - <<'EOF'`) — if the closing delimiter arrives
  indented or without a trailing newline, git blocks on stdin forever and the
  call hangs until timeout.

# Verification

- Verify before asserting: grep/read the source, fetch authoritative docs, check
  adjacent repos in the parent directory. Don't rely on general knowledge for
  specifics (header behavior, pricing, API contracts).
- Cite the source — `path/to/file.go:42` for code, URL for docs. If you can't
  cite, label it "unverified assumption" and say how to verify.

# Cost management

- Don't burn the top-tier model on mechanical work. When delegating to a
  subagent and your harness lets you set its model, default to the cheapest
  tier adequate to the task — see
  `.agents/skills/shared/SUBAGENT-STEERABILITY.md`.
- Prompt before running software-engineering work — product-code edits,
  design, debugging — on a downgraded model. Mechanical, read-only, git, and
  docs work needs no prompt.

# Skills

- Skills live only in `.agents/skills/<name>/`. `.claude/skills` is a symlink to
  `.agents/skills`, so editing once covers both harnesses — do not create a
  separate copy under `.claude/`.
- Keep skill content harness-agnostic. Use generic language ("prompt the user",
  "spawn a subagent") rather than harness-specific tool names. Confine any
  Claude-specific guidance (e.g. agent teams) to a clearly-labeled optional
  "Agent teams (if your harness supports it)" section.
- Convention skills are mandatory, not optional. Load them before touching the
  files they govern. Claude Code auto-loads these via path-scoped rules, but
  other harnesses must invoke them explicitly:
  - Before editing, reviewing, or creating Go (`*.go`) files: load
    `go-conventions`.
  - Before editing, reviewing, or creating Markdown (`*.md`) files: load
    `markdown-conventions`.
