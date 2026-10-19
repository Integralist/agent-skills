---
name: teach
description: >-
  Teach the user a skill or concept over several sessions, keeping the learning
  state in the current workspace. Use when the user asks to learn a topic.
disable-model-invocation: true
argument-hint: What would you like to learn about?
metadata:
  model-tier: moderate
---

# Teach

Teach the user a topic across many sessions, with the current directory as the
teaching workspace. Every lesson serves the user's mission, sits in their zone
of proximal development (hard enough to stretch them, not so hard they stall),
and rests on trusted sources rather than your parametric knowledge. Deep
learning needs knowledge from high-trust resources, skills from interactive
lessons, and wisdom from other practitioners; the mix varies by topic, from
knowledge-heavy theoretical physics to skills-heavy yoga.

**Workspace.** Create each file when it's first needed. The formats for
`MISSION.md`, `RESOURCES.md`, `GLOSSARY.md`, and learning records are in
[WORKSPACE-FILES.md](WORKSPACE-FILES.md).

- `MISSION.md`: why the user is learning this; every teaching decision traces
  back to it.
- `RESOURCES.md`: the vetted sources that lessons draw from.
- `GLOSSARY.md`: the workspace's canonical terms, used in every lesson.
- `learning-records/NNNN-slug.md`: what the user has shown they know, which
  sets their zone of proximal development.
- `lessons/NNNN-slug.html`: one lesson per file, the main unit of teaching.
- `reference/*.html`: quick-reference sheets (syntax, algorithms, poses,
  routines) that compress what lessons taught and that the user comes back
  to. Make them print well.
- `NOTES.md`: how the user likes to be taught, and anything else to keep in
  mind when designing lessons.

**Each session:**

1. **Pin down the mission.** If `MISSION.md` is missing or vague, ask why the
   user wants to learn this until you have a concrete outcome; without it
   lessons drift into the abstract and you can't judge what's next. Done when
   `MISSION.md` states a concrete goal.
2. **Gather resources** until `RESOURCES.md` covers what the mission needs.
   Fan out read-only research subagents, following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), to find
   and vet candidates and return annotated links; they change nothing. Done
   when the next lesson's claims can all be sourced from `RESOURCES.md`.
3. **Pick the next thing.** Teach what the user names, if they name
   something. Otherwise read `learning-records/` and pick the most
   mission-relevant skill in their zone. When they say they already know
   something, write a learning record for it. Done when you've named one
   tightly scoped skill.
4. **Write the lesson,** then help the user open it with a single command.
   Done when the lesson file exists and the user has the command.
5. **Record what changed:** a learning record when the user shows real
   understanding, a glossary term once they use it correctly, a reference
   sheet for knowledge they'll reuse, and teaching preferences in `NOTES.md`.
   Done when the workspace reflects what the user now knows.

**Lessons.** Each lesson is one self-contained, well-designed HTML file that
teaches one skill, quickly, for a tangible win. Teach only the knowledge that
skill needs, from trusted resources, then have the user practise it on a
feedback loop that responds as immediately and automatically as possible:
in-browser quizzes and tasks, guided real-world steps such as yoga poses, or
scenario questions in the chat. Cite a source for every claim, use the
workspace glossary's terms, and remind the user they can ask you follow-up
questions. When an analogy would help, follow
[ANALOGY-GUIDANCE.md](../shared/ANALOGY-GUIDANCE.md).

**Wisdom.** When a question needs real-world experience, give your best
answer, then point the user to a high-reputation community where they can
test the skill for real: a forum, subreddit, class (budget permitting), or
local group. If they'd rather not join one, respect that and note it in
`RESOURCES.md`.
