# Go Tooling Reference

Detail for the tooling steps in [conventions-go](../SKILL.md): choosing `go
fix` fixers, and looking up APIs with `go doc`.

## Modernizing with `go fix`

`go fix` runs every registered fixer by default, so preview before applying:

```bash
go fix -diff ./path/to/pkg/...                 # review; exits 1 when changes exist
go fix ./path/to/pkg/...                       # apply after review
go fix -diff -rangeint ./path/to/pkg/...       # only rangeint
go fix -stringsseq=false ./path/to/pkg/...     # all except stringsseq
```

It respects the module's `go` directive. Raise the directive only when the
task deliberately adopts a newer language or standard-library feature. Read a
fixer's docs with `go tool fix help` or `go tool fix help <name>`.

Mark a deprecated wrapper or compatibility shim with `//go:fix inline` when
`go fix` should rewrite its callers, including those in other packages.

## Looking up APIs

Use gopls `go_package_api` for workspace packages. Use `go doc` for
dependencies, symbol details, source, commands, or unexported identifiers,
adding `-src`, `-cmd`, `-u`, or `-all` as needed:

```bash
go doc <path>
go doc <path>.<Symbol>
go doc -src <path>.<Symbol>
```

Run `go doc` from inside the module so it resolves the version `go.mod`
selects. If a dependency is unavailable, fix the module state first rather
than recalling another version from memory.

For other questions, use the source that owns the answer: the Go
specification for language semantics, `go doc` or pkg.go.dev for
standard-library APIs, the release notes for which version added something,
and the module reference or command help for tooling and module behaviour.
