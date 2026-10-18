# Workspace Files

Formats for the teaching workspace's state files. Keep each short and revise
it in place as the user's understanding or goals change, so nothing stale
steers the next session.

## MISSION.md

The reason the user is learning this topic. One mission per workspace: two
unrelated topics are two workspaces. Make it concrete ("ship a Rust CLI to my
team", not "learn Rust"), and if the user can't say why, interview them before
writing anything, since a vague mission is worse than none. Past one screen,
it has become a plan; cut it back.

````md
# Mission: {Topic}

## Why
{1–3 sentences: the real-world outcome the user is chasing, not "to understand X".}

## Success looks like
- {A specific, observable thing the user will be able to do}

## Constraints
- {Time, budget, commitments, learning preferences}

## Out of scope
- {Adjacent topics the user doesn't want to chase yet}
````

## RESOURCES.md

The trusted sources lessons draw from. Include only high-trust ones: primary
sources, recognised experts, peer-reviewed work, and well-moderated
communities, never marketing dressed as education. Annotate every entry with
what it covers and when to reach for it. List what the mission needs but no
good source covers under `## Gaps`, to drive future searches. Remove sources
that prove wrong, shallow, or off-mission; five sharp sources beat thirty
mediocre ones. Note it here if the user has opted out of communities.

````md
# {Topic} Resources

## Knowledge

- [Book: _The Science and Practice of Strength Training_, Zatsiorsky & Kraemer](https://example.com)
  Foundational text on programming and adaptation. Use for: periodisation, recovery, intensity zones.

## Wisdom (Communities)

- [r/weightroom](https://reddit.com/r/weightroom)
  Moderated against bro-science. Use for: programme critique, plateau troubleshooting.
````

## GLOSSARY.md

The workspace's canonical terms; every lesson, exercise, and record uses them.
Writing a tight definition is itself evidence of understanding, so add a term
only once the user can use it correctly, not when they first meet it.

- **Be opinionated:** pick one word per concept and list the rest under
  `_Avoid_`.
- **Keep definitions tight:** one or two sentences on what the term is, using
  the glossary's own terms where they fit.
- **Resolve ambiguity** the wider field leaves open: "In this workspace, 'set'
  always means a working set; warm-ups are tracked separately."
- **Group under subheadings** when clusters emerge.

````md
# {Topic} Glossary

{One or two sentences on the topic this glossary covers.}

## Terms

**Progressive overload**:
Systematically increasing the demand on a muscle over time, via load, volume, or intensity.
_Avoid_: Pushing harder, levelling up
````

## Learning records

Records in `learning-records/`, numbered one above the highest existing
(`0001-slug.md`, `0002-slug.md`), capture what will steer future sessions,
like ADRs for learning. Write one when the user:

1. shows they can use something non-trivial correctly, which raises the floor
   for what to teach next;
2. says they already know something, recording the depth they claim;
3. has a misconception corrected, which predicts stumbles on related topics;
4. shifts their goal, in which case update `MISSION.md` too.

Coverage isn't learning, so wait for evidence. Leave out terms the glossary
already defines and session-by-session activity; records hold decisions, not
a journal.

````md
# {Short title of what was learned or established}

{1–3 sentences: what's now known, and why it changes what to teach next.}
````

Add `Status: active | superseded by LR-NNNN` frontmatter when a record
replaces an earlier one, and mark the old one superseded rather than deleting
it. Add an **Evidence** or **Implications** line only when it's non-obvious.
