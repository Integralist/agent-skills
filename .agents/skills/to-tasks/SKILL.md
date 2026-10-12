---
name: to-tasks
description: >-
  Turn the plan already worked out this session into a mechanical,
  TDD-shaped task list a cheaper agent can execute without exploring —
  verbatim tests, verbatim code, and a runnable check per task. Writes
  to projects/<slug>/tasks-slice-<n>.md or projects/<slug>/tasks.md.
disable-model-invocation: true
argument-hint: "[slice scope or plan path]"
---

# To Tasks

Read and follow [the slice compiler](COMPILE.md) in this conversation. Preserve
its precondition, input selection, language conventions, delivery approval,
self-contained task contract, and project README maintenance.

## Hand-off

Stop at the task document. To run one task or slice manually, point a fresh
agent at its path using [`next-task`](../next-task/SKILL.md) or
[`next-slice`](../next-slice/SKILL.md). For premium coordination with cheap
implementation across the plan, offer
[`execute-plan`](../execute-plan/SKILL.md) with the parent plan path.

Generating tasks never authorizes implementation by itself.
