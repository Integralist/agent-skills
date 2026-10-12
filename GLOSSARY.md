# Agent Skills Glossary

Terminology for planning, task compilation, and execution workflows.

## Delivery and execution

**Slice**:
A narrow, independently verifiable increment that delivers behavior across the
system boundaries it touches.

**Slice milestone**:
A verifiable outcome delivered by a slice, used to track coarse plan progress
rather than executable implementation steps.
_Avoid_: Plan task

**Implementation task**:
A bounded unit of executable work compiled for a slice. Several tasks may
support one slice milestone, and one task may support several milestones.
_Avoid_: Slice milestone

**PDD milestone**:
An initiative-level outcome that scopes Product-Engineering Discovery and
Design approvals. It is distinct from a slice milestone in an engineering plan.
_Avoid_: Slice milestone
