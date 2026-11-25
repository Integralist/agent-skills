# Agent Skills Glossary

Shared terms for how this repository plans, splits, and builds features.

## Delivery and execution

### Slice

A small vertical cut of a feature that delivers working behaviour across every
system layer it touches, verified end to end. Teams ship work in slices so
every merge delivers usable behaviour rather than half-wired layers waiting on
later changes.

### Slice milestone

A checkable outcome that marks what must work when a slice finishes. Milestones
let a plan track real progress without locking engineers into specific file
lists before coding starts.
_Avoid_: Plan task

### Implementation task

One self-contained coding step compiled for a slice, with a failing test first
and the smallest change to pass it. Tasks give an engineer or agent a clear
unit of work; several tasks can serve one slice milestone, and one task can
support several milestones.
_Avoid_: Slice milestone

### PDD milestone

A project-level checkpoint in Product-Engineering Discovery and Design (PDD)
where stakeholders approve scope, specs, or architecture. Keeping PDD milestones
separate from slice milestones stops sign-off gates from colliding with
engineering delivery steps.
_Avoid_: Slice milestone
