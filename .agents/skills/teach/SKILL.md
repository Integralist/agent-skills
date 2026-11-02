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

Teach the user across sessions in the current directory, which is the
teaching workspace. Every lesson must serve the user's concrete mission,
match their zone of proximal development (challenging enough to stretch them
without stalling them), and draw on trusted sources rather than parametric
knowledge. Deep learning draws on high-trust knowledge sources, interactive
skill practice, and practitioners' wisdom; the mix depends on the topic.

## Workspace state

Create each workspace file only when first needed. Before creating or updating
`MISSION.md`, `RESOURCES.md`, `GLOSSARY.md`, a learning record, or any other
workspace state described there, read
[WORKSPACE-FILES.md](references/WORKSPACE-FILES.md) for its format and rules.

The workspace holds the mission, vetted resources, canonical terms, learning
records, lessons, reference sheets, and teaching preferences. The reference
explains which files to create and when.

## Each session

1. **Pin down the mission.** If `MISSION.md` is missing or vague, ask why the
   user wants to learn until you have a concrete outcome. Without one, lessons
   drift into the abstract and it is hard to choose what comes next. Finish
   when `MISSION.md` states a concrete goal.
2. **Gather resources.** Continue until `RESOURCES.md` covers the mission.
   Fan out read-only research subagents to find and vet candidates and return
   annotated links, following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md). Subagents
   change nothing. Finish when every claim for the next lesson can be sourced
   from `RESOURCES.md`.
3. **Choose the next skill.** Teach what the user names, if they name
   something. Otherwise read `learning-records/` and choose the most
   mission-relevant skill within their zone. When the user says they already
   know something, write a learning record for it. Finish when one tightly
   scoped skill is chosen.
4. **Write the lesson.** Create the lesson file and help the user open it with
   a single command.
5. **Record learning.** Update state when the user shows real understanding:
   create a learning record, add a glossary term once they use it correctly,
   create a reference sheet for knowledge they will reuse, and record
   teaching preferences in `NOTES.md`, as appropriate. Finish when the
   workspace reflects what the user now knows.

## Lessons and follow-up

Each lesson is one self-contained, well-designed HTML file that quickly
teaches one skill for a tangible win. Teach only the knowledge that skill
needs, cite a trusted source for every claim, and use the workspace glossary's
terms. Give the user practice on a feedback loop that responds as immediately
and automatically as possible: an in-browser quiz or task, guided real-world
steps such as yoga poses, or scenario questions in chat. Remind the user they
can ask follow-up questions. Follow
[ANALOGY-GUIDANCE.md](../shared/ANALOGY-GUIDANCE.md) when an analogy would
help.

**Wisdom.** When a question needs real-world experience, give your best
answer and point to a high-reputation community where the user can practise
for real: a forum, subreddit, class (budget permitting), or local group. If
they would rather not join one, respect that and note it in `RESOURCES.md`.
