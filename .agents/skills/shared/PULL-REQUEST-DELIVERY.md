# Pull Request Delivery

Use this guide when deciding whether implementation work belongs in one pull
request, a stack, or independent pull requests.

## Choose the delivery shape

First group tasks into **review units**. A review unit is a coherent change that
stays buildable, testable, and understandable on its own. It may contain one
task, several tasks, or several vertical slices.

- **Single PR** — the units are tightly coupled, or splitting them would leave
  incomplete intermediate states.
- **Stack** — two or more review units must merge in order, and reviewing them
  separately meaningfully reduces review scope.
- **Independent PRs** — the units can merge in any order without relying on
  each other's code.

Never derive one PR or stack layer per task automatically. Group by review
coherence and dependency, not task count.

## Recommend a stack

Recommend stacked PRs only when all of these hold:

- The work has at least two dependent review units.
- Every layer passes its relevant tests and checks.
- Each higher layer depends on the layer directly below it.
- Separate reviews are clearer than one combined review.

When a stack is recommended and no delivery choice has been confirmed, show the
proposed grouping and wait for the user to accept, change, or decline it:

```txt
I recommend a 2-layer stacked PR:

1. Foundation — Tasks 1–3
2. API integration — Tasks 4–6, based on Foundation

Each layer remains testable and reviewable on its own.
```

## Record the decision

Record the confirmed shape in a `Pull Request Delivery` section:

```md
## Pull Request Delivery

- **Mode:** Stack

| Layer | Base                | Includes  | Branch              |
| ----- | ------------------- | --------- | ------------------- |
| 1     | `{trunk}`           | Tasks 1–3 | `{foundation}`      |
| 2     | `{foundation}`      | Tasks 4–6 | `{api-integration}` |
```

For a stack, list layers bottom to top. For one PR, use one row. For independent
PRs, give each row the trunk as its base.
