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

Design deep modules: place substantial behaviour behind a small interface,
choose a clean seam, and test through that interface. Use the vocabulary and
principles here whenever code is designed or restructured. Deep modules give
callers leverage and maintainers locality.

## Vocabulary

Use these terms exactly; the shared vocabulary is deliberate. Prefer them to
"component," "service," "API," or "boundary."

- **Module:** Anything with an interface and implementation, at any scale: a
  function, class, package, or slice spanning tiers. Avoid *unit*,
  *component*, and *service*.
- **Interface:** Everything a caller must know to use the module correctly:
  its type signature plus invariants, ordering constraints, error modes,
  required configuration, and performance characteristics. It is more than a
  language's `interface` keyword or a class's public methods. Avoid *API* and
  *signature*.
- **Implementation:** The code inside a module. An *adapter* names a role,
  not what's inside: a Postgres repository can be an adapter with a large
  implementation; an in-memory fake can have a small one.
- **Depth:** Leverage at the interface: how much behaviour a caller or test
  can exercise per unit of interface it learns. A module is deep when much
  behaviour sits behind a small interface, and shallow when the interface is
  nearly as complex as the implementation. Depth measures leverage, not the
  ratio of implementation lines to interface lines, which rewards padding.
- **Seam** (Michael Feathers): The place a module's interface lives, where
  behaviour can change without editing that place. Deciding where the seam
  goes is separate from deciding what sits behind it. Avoid *boundary*, which
  collides with DDD's *bounded context*.
- **Adapter:** A concrete thing that satisfies an interface at a seam. The
  term names its role, not its contents.
- **Leverage:** What callers get from depth: more capability per unit of
  interface, so one implementation pays back across call sites and tests.
- **Locality:** What maintainers get from depth: change, bugs, knowledge, and
  verification concentrate in one place, so a fix lands once.

## Design principles

- **Depth belongs to the interface.** A deep module can use small, swappable
  parts and internal seams that its own tests use; keep those out of the
  public interface. To deepen a module, cut methods, simplify parameters, and
  hide more behind the seam.
- **Deletion test.** Imagine deleting the module. If complexity vanishes, it
  was a pass-through; if it reappears across callers, the module was earning
  its keep.
- **Interface is the test surface.** Callers and tests cross the same seam.
  Needing to test past it means the module has the wrong shape.
- **One adapter is a hypothetical seam; two make it real.** Add a seam only
  when something actually varies across it, typically production and test.
- **Testable by construction.** Accept dependencies rather than creating them
  inside, and return results rather than mutating shared state, so tests can
  supply inputs and check outputs at the interface.
- **Redesign from first principles.** For a new requirement, read the affected
  modules and ask what interface and implementation you would build if the
  requirement had existed from day one. Compare that with extending the
  current design; choose the smallest coherent change, not a rewrite by
  default. Plan the whole change and deliver it in increments. Keep existing
  behaviour except where the requirement changes it. Carry the design through
  every type, caller, test, doc, and example. Prefer a coherent abstraction
  over another feature-specific exception.

## Further procedures

- When deepening a cluster of shallow modules, read
  [DEEPENING.md](references/DEEPENING.md) for how dependency categories
  determine the seam and tests.
- When exploring alternative interfaces, follow
  [DESIGN-IT-TWICE.md](references/DESIGN-IT-TWICE.md) to have parallel
  subagents design alternatives and compare them.
