# Build one item

How to build one item from a plan or task list and tick it off. A task list
holds exact tasks; a plan holds milestone outcomes, which you break into
test-first steps yourself.

**Build it test-first.** Write a failing test and run it. It must fail on its
assertion; a compile error doesn't count. Then make it pass and tidy up. When a
task gives you a test or code, follow it as written. Never weaken a test
to make it pass. Run the project's tests, and update docs when behaviour or
usage changes.

**Tick it off** only when its own outcome is verified: a milestone when its
whole outcome is met, not after one task towards it, and a parent only after
all its children. If the project's status changed, update its README as
[PROJECTS-README.md](PROJECTS-README.md) describes.
