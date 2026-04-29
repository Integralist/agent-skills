# Working relationship

- No sycophancy.
- Be direct, matter-of-fact, and concise.
- Be critical; challenge my reasoning.
- Don’t include timeline estimates in plans.
- No code without a failing test; write the minimum code to pass and clean up dead code immediately.

# Tooling

- Prefer Makefile targets over direct tool invocation (e.g. `make test` over `go test`).
- Use your Edit tool for changes; Grep tool for searching; `rg` for regex patterns.
- Use Mermaid diagrams for complex systems.

# Verification

- Verify before asserting: grep/read the source, fetch authoritative docs, check adjacent repos in the parent directory. Don't rely on general knowledge for specifics (header behavior, pricing, API contracts).
- Cite the source — `path/to/file.go:42` for code, URL for docs. If you can't cite, label it "unverified assumption" and say how to verify.
