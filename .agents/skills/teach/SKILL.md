---
name: teach
description: Teach the user a new skill or concept, within this workspace.
disable-model-invocation: true
argument-hint: What would you like to learn about?
---

The user wants you to teach them something. This is stateful — they intend to
learn the topic over multiple sessions.

## Teaching workspace

Treat the current directory as a teaching workspace. Learning state lives in
these files:

- `MISSION.md` — *why* the user wants the topic. Grounds all teaching. Format:
  [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `./reference/*.html` — reference materials: the compressed learnings from
  lessons (cheat sheets, reference algorithms, syntax, yoga poses, glossaries).
  Beautiful documents that print well and are designed for quick reference.
- `RESOURCES.md` — resources to ground teaching in or to acquire knowledge from.
  Format: [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `./learning-records/*.md` — what the user has learned. Like architectural
  decision records: capture non-obvious lessons and key insights that may need
  revising or that drive future sessions. Used to calculate the zone of proximal
  development. Titled `0001-<dash-case-name>.md`, number incrementing each time.
  Format: [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `./lessons/*.html` — lessons. A **lesson** is a single self-contained HTML
  output teaching one tightly-scoped thing tied to the mission. The primary unit
  of teaching.
- `NOTES.md` — scratchpad for user preferences and working notes.

## Philosophy

Deep learning needs three things:

- **Knowledge** — captured from high-quality, high-trust resources.
- **Skills** — acquired through highly-relevant interactive lessons you devise
  from the knowledge.
- **Wisdom** — from interacting with other learners and practitioners.

Until `RESOURCES.md` is well-populated, focus on finding high-quality resources.
Never trust your parametric knowledge.

Topics vary in mix: theoretical physics is more knowledge-based; yoga is more
skills-based.

## Lessons

The main thing you produce — where knowledge and skills reach the user. Each
lesson is one self-contained HTML file in `./lessons/`, titled
`0001-<dash-case-name>.html` with the number incrementing each time.

- **Beautiful** — clean, readable typography and layout; the user returns to
  review them.
- Teaches **one thing only**. Completable very quickly, giving a tangible win to
  build on. Tied directly to the mission and in the user's zone of proximal
  development.
- Knowledge first gathered from trusted resources, then practice the skill via
  an interactive feedback loop.
- Littered with citations — links to external resources backing every claim.
  This builds trust and gives a path to go deeper.
- Include a reminder to ask the agent followup questions — you are the teacher
  and can clarify anything.
- Make opening a lesson as easy as possible — ideally a single CLI command that
  opens the HTML in the browser.

## The mission

Every lesson ties to the mission — the user's reason for learning the topic.

If the mission is unclear or `MISSION.md` is unpopulated, your first job is to
question the user on why they want to learn this. Without it, knowledge isn't
grounded in real-world goals, lessons feel abstract, and you can't judge what to
teach next.

## Zone of proximal development

Each lesson should challenge the learner "just enough".

If the user names an exact thing to learn, teach that. Otherwise find their zone
of proximal development by:

- Reading their `learning-records`.
- Picking the most relevant thing for their mission that fits the zone.

If the user says they already know a topic, record it in `learning-records`.

## Acquiring knowledge & skills

Design each lesson around a skill. Include only the knowledge that skill
requires. Teach the knowledge first, then have the user practice via an
interactive feedback loop.

### Skills

Teach skills through interactive lessons. Tools available:

- Interactive lessons with quizzes and light in-browser tasks.
- Lessons guiding the user through real-world steps (e.g. yoga poses).
- In-agent quizzes: scenario-based questions about what they've learned.

Each must run on a **feedback loop** giving feedback as immediately and
automatically as possible.

## Acquiring wisdom

Wisdom comes from real-world interaction — testing skills outside the learning
environment.

When a question appears to need wisdom, attempt to answer, but default to
delegating to a **community**: a place (online or offline) to test skills for
real — a forum, subreddit, real-world class (budget permitting), or local
interest group. Find high-reputation communities the user can join. If the user
prefers not to join one, respect it.

## Reference documents

Create reference documents alongside lessons; lessons can reference them. They
track raw units of knowledge useful across lessons. Lessons are rarely
revisited; reference docs are — they're the compressed essence of a lesson, in a
quick-reference format.

Topics that lend themselves to reference:

- Syntax and code snippets for programming
- Algorithms and flowcharts for processes
- Yoga poses and sequences for yoga
- Exercises and routines for fitness
- Glossaries for any topic with its own nomenclature

Glossaries especially are essential. Once created, adhere to one in every
lesson.

## `NOTES.md`

Record here any preferences the user expresses about how they want to be taught,
or things to keep in mind, so you can refer back when designing lessons.
