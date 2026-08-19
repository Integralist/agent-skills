# Linter Suppression Directives

Use the exact directive syntax each tool expects — the wrong
form is silently ignored, leaving the warning in place.

| Tool          | Directive                                              | Scope                                     |
| ------------- | ------------------------------------------------------ | ----------------------------------------- |
| golangci-lint | `//nolint:<linter>[,<linter>] // <reason>`             | same line (reason after `//` is required) |
| staticcheck   | `//lint:ignore <check> <reason>`                       | same line                                 |
| gosec         | `// #nosec G<code> <reason>`                           | same line or line above                   |
| contextcheck  | `//nolint:contextcheck`                                | function doc comment above `func`         |
| revive        | `//revive:disable:<rule>` ... `//revive:enable:<rule>` | from directive until re-enabled           |
| codespell     | `//codespell:ignore` or `// codespell:ignore <word>`   | same line                                 |
| yamllint      | `# yamllint disable-line rule:<rule>`                  | same line                                 |
| yamllint      | `# yamllint disable rule:<rule>`                       | rest of file (or until `enable`)          |
| alex          | `<!--alex ignore <word>-->`                            | following text                            |
| alex          | `<!--alex disable <rule> <rule>-->`                    | following text                            |

## Examples

```go
result := cm.customerKeySetName("customer123") //nolint:scopeguard // paired with expected below
badRand := rand.Intn(10)                       //lint:ignore SA1019 tests seed deterministically
cmd := exec.Command(userInput)                 // #nosec G204 input validated in handler
//revive:disable:unexported-return
func internalBuilder() *unexportedThing { ... }
//revive:enable:unexported-return
// codespell:ignore deatil
```

contextcheck false positives — place the directive on the
function's doc comment, not on the inner call:

```go
//nolint:contextcheck
func call1() {
    doSomeThing(context.Background())
}
```

```yaml
# yamllint disable-line rule:line-length
really_long_key: "................................................................................"
```

```markdown
<!--alex ignore host-hostess-->
The host greets each guest at the door.
```

Reference: revive directive docs —
https://github.com/mgechev/revive?tab=readme-ov-file#comment-directives
