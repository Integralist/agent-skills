# Go Tooling Reference

Detail for the tooling steps in [conventions-go](../SKILL.md): installing
tools, choosing `go fix` fixers, and looking up APIs with `go doc`.

## Installing missing tools

```bash
go install mvdan.cc/gofumpt@latest
go install github.com/incu6us/goimports-reviser/v3@latest
go install github.com/go-critic/go-critic/cmd/go-critic@latest
go install honnef.co/go/tools/cmd/staticcheck@latest
go install github.com/kojah/gohawk@latest  # requires Go 1.26+
```

If an installed binary is not found on `PATH`, add `$(go env GOBIN)` (or
`$(go env GOPATH)/bin`). See the pinned
[Gohawk installation guide](https://github.com/kojah/gohawk/blob/d5b1c83eae03553d40cbd9d12d238d3e7d346ed8/docs/installation.md#install-the-cli).

## Modernizing with `go fix`

`go fix` runs every registered fixer by default, so preview before applying:

```bash
go fix -diff ./path/to/pkg/...                 # review; exits 1 when changes exist
go fix ./path/to/pkg/...                       # apply after review
go fix -diff -rangeint ./path/to/pkg/...       # only rangeint
go fix -stringsseq=false ./path/to/pkg/...     # all except stringsseq
```

It respects `go.mod`'s `go` directive; raise the directive only when the task
deliberately adopts a newer feature. Read fixer docs with `go tool fix help`
or `go tool fix help <name>`. Mark deprecated wrappers/shims with
`//go:fix inline` when `go fix` should rewrite callers.

## Looking up APIs

Use gopls `go_package_api` for workspace packages, and `go doc` (`-src`,
`-cmd`, `-u`, `-all`) from inside the module for dependencies so it resolves
the version pinned by `go.mod`. Check the Go spec, `go doc`, or release notes
and cite the source rather than guessing.
