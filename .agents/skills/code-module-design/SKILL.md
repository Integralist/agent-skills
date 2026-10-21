---
name: code-module-design
description: >-
  Vocabulary and principles for designing deep modules. Use when designing or
  improving a module's interface, looking for deepening opportunities, deciding
  where a seam goes, making code more testable or easier for agents to
  navigate, or when another skill needs the deep-module vocabulary.
metadata:
  model-tier: complex
---

# Code Module Design

Design deep modules: a lot of behaviour behind a small interface, placed at a
clean seam and tested through that interface. Use these terms and principles
wherever code is designed or restructured, so callers get leverage,
maintainers get locality, and tests cross the same seam callers do.

## Glossary

Use these terms exactly; a shared vocabulary is the point. Reach for the
listed term before "component," "service," "API," or "boundary."

**Module**:
Anything with an interface and an implementation, at any scale: a function,
class, package, or a slice spanning tiers.
_Avoid_: unit, component, service

**Interface**:
Everything a caller must know to use the module correctly: the type
signature, plus invariants, ordering constraints, error modes, required
configuration, and performance characteristics. More than a language's
`interface` keyword or a class's public methods.
_Avoid_: API, signature

**Implementation**:
The code inside a module. Distinct from adapter, which names a role: a
Postgres repository is an adapter with a large implementation, an in-memory
fake one with a small implementation.

**Depth**:
Leverage at the interface: how much behaviour a caller or test can exercise
per unit of interface they learn. A module is deep when a lot of behaviour
sits behind a small interface, and shallow when the interface is nearly as
complex as the implementation. Measure depth as leverage, not as a ratio of
implementation lines to interface lines, which rewards padding.

**Seam** (Michael Feathers):
The place a module's interface lives, where behaviour can change without
editing that place. Where the seam goes is its own decision, separate from
what goes behind it.
_Avoid_: boundary, which collides with DDD's bounded context

**Adapter**:
A concrete thing that satisfies an interface at a seam. The word names its
role, not what's inside.

**Leverage**:
What callers get from depth: more capability per unit of interface, so one
implementation pays back across every call site and test.

**Locality**:
What maintainers get from depth: change, bugs, knowledge, and verification
concentrate in one place, so a fix lands once.

## Principles

- **Depth belongs to the interface.** A deep module can be built from small,
  swappable parts with internal seams its own tests use; keep those out of
  the interface. To deepen a module, cut methods, simplify parameters, and
  hide more behind the seam.
- **The deletion test.** Imagine deleting the module. If complexity
  vanishes, it was a pass-through; if it reappears across callers, it was
  earning its keep.
- **The interface is the test surface.** Callers and tests cross the same
  seam. Needing to test past the interface means the module is the wrong
  shape.
- **One adapter means a hypothetical seam; two means a real one.** Add a seam
  only when something actually varies across it, typically production and
  test.
- **Testable by construction.** Accept dependencies rather than creating them
  inside, and return results rather than mutating shared state, so a test can
  supply inputs and check outputs at the interface.
- **Redesign from first principles.** For a new requirement, read the
  affected modules and ask what interface and implementation you'd build had
  the requirement been there from day one. Compare that with extending the
  current design, and pick the smallest coherent change rather than a rewrite
  by default. Plan the whole change and deliver it in increments. Keep existing
  behaviour except where the requirement changes it. Carry the design through
  every type, caller, test, doc, and example. Prefer a coherent abstraction
  over another feature-specific exception.

## Going deeper

- **Deepening a cluster of shallow modules:** read
  [DEEPENING.md](DEEPENING.md) for how its dependencies decide the seam and
  the tests.
- **Exploring alternative interfaces:** follow
  [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md) to have parallel subagents design
  the interface several different ways, then compare them.
