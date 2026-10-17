# Deepening

Deepen a cluster of shallow modules by classifying its dependencies first:
the category decides where the seam goes and how the deepened module is
tested. Uses the vocabulary in [SKILL.md](SKILL.md).

**Dependency categories.**

- **In-process:** pure computation or in-memory state, no I/O. Always
  deepenable: merge the modules and test through the new interface, with no
  adapter.
- **Local-substitutable:** has a local stand-in, such as PGLite for Postgres
  or an in-memory filesystem. Deepenable when the stand-in exists; run it in
  the test suite. The seam stays internal, with no port at the external
  interface.
- **Remote but owned:** your own services across a network. Define a port at
  the seam; the deep module owns the logic and takes the transport as an
  adapter (HTTP, gRPC, or a queue in production, in-memory in tests), so the
  logic stays in one deep module even though it's deployed across a network.
- **True external:** third-party services you don't control, such as Stripe
  or Twilio. The module takes the dependency as an injected port, and tests
  supply a mock adapter.

**Testing: replace, don't layer.** Write the new tests at the deepened
module's interface, asserting observable outcomes rather than internal state,
then delete the old unit tests on the shallow modules they replace. A test
that must change when the implementation changes is testing past the
interface.
