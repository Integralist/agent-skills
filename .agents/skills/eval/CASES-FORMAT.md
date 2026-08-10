# Cases format

`.agents/skills/<skill>/evals/cases.json` — a JSON array of case objects,
written by hand and versioned with the skill it tests.

## Fields

| Field                  | Required | Purpose                                                                           |
| ---------------------- | -------- | --------------------------------------------------------------------------------- |
| `id`                   | yes      | Stable kebab-case identifier. Runs compare by `id`, so a rename drops its history |
| `prompt`               | yes      | What the user would type — realistic phrasing, not a statement of expected output |
| `setup`                | no       | Shell commands building the starting state, run in order inside the sandbox       |
| `checks`               | yes      | Plain-English assertions, graded by reading the transcript                        |
| `keep_sandbox_on_fail` | no       | `true` keeps the sandbox when a check fails. Default `false`                      |

## Example

```json
[
  {
    "id": "single-file-fix",
    "prompt": "I fixed a nil pointer bug in auth.go. Commit it.",
    "setup": [
      "git init -q",
      "git config user.email eval@example.com",
      "git config user.name 'Eval Bot'",
      "printf 'package auth\\n\\nfunc Check() bool { return true }\\n' > auth.go",
      "git add auth.go && git commit -q -m 'initial commit'",
      "printf 'package auth\\n\\nfunc Check() bool {\\n\\treturn false\\n}\\n' > auth.go"
    ],
    "checks": [
      "Inspects git status and the diff before committing",
      "Stages auth.go alone",
      "Commit message is imperative mood with no trailing period",
      "Leaves the commit unpushed"
    ]
  }
]
```

## Writing checks

- One observable behaviour per check. A check asserting two things returns a
  verdict that names neither.
- Phrase it as what the transcript should show, so the grader can point at the
  line that decided it.
- State the target behaviour rather than the banned one. "Leaves the commit
  unpushed" grades the same thing as "does not push", and survives being read
  by the executor if cold isolation ever slips.
- Five to eight cases is a working suite. Depth comes from cases earned by real
  failures, not from enumerating variations up front.

## Fabricating state

`setup` isolates the filesystem and git. It cannot isolate an external
service — posting to Slack or filing a ticket during an eval does it for
real. No skill in this repo talks to one; if that changes, point the case at
a throwaway resource, or grade the calls the skill would make rather than
executing them.
