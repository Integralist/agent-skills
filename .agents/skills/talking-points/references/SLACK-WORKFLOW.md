# Talking Points: Slack Workflow

Read this file when running the access probe, loading or editing settings,
searching Slack, or ranking topics for the report.

## Settings setup and editing

When settings are invalid or `--edit` is present:

1. Ask in one message, as a numbered list, for the user's name or Slack
   username, their team channels, and teammates they talk to directly
   (optional). When editing, show current values.
2. Resolve people with Slack user search and channels with channel search, in
   parallel. In one follow-up, let the user choose among multiple matches and
   ask again only for values that did not resolve.
3. Show the resolved settings and ask for confirmation. Then create the
   directory with `mkdir -p` and write the file with mode `600`.
4. With `--edit`, print the saved path and stop.

Use this settings shape:

```json
{
  "name": "Jane Doe",
  "slack_user_id": "U0123456789",
  "channels": [{ "name": "#team-chat", "id": "C0123456789" }],
  "teammates": [{ "name": "John Roe", "id": "U0987654321" }]
}
```

## Search groups

Run all searches in parallel, exclude bots, and page with `cursor` until the
search is exhausted or reaches 100 messages:

- **User in team channels:** `from:<@ID> in:<#C1> in:<#C2> … after:DATE`.
- **Team channels:** `in:<#C1> in:<#C2> … after:DATE`.
- **User's DMs:** `from:<@ID> after:DATE`, with `channel_types: im,mpim`.
- **Teammate DMs:** one `with:<@TEAMMATE> after:DATE` search per teammate,
  with `channel_types: im,mpim`. Search separately because `with:` filters
  AND rather than OR.

For every hit that is a reply or has replies, read the whole thread; complaints
often live there.

## Cluster and score

Group messages by subject—a project, system, process, person, or decision—not
by channel. Score each topic using:

- **Frequency:** distinct messages and days.
- **Intensity:** frustration, blockers, repeated asks, “again,” and “still.”
  Weight the user's own messages highest.
- **Breadth:** distinct people.
- **Recency.**

Tag a topic `1:1` when it appears only in DMs or concerns a named person's
behaviour or performance; otherwise tag it `retro`.

## Report shape

Print the highest-scoring topics first, up to ten total. Close with one line
naming the top `retro` and top `1:1` topic. If nothing rises above noise,
print `No recurring topics in the last <N> days.`

```text
Talking points — <start date> to <today> (<n> messages scanned)

1. <Topic> [retro] — 9 msgs, 4 days, 3 people
   Signal: <one line: what keeps coming up and why it hurts>
   Raise as: <one line: question or proposal to bring>
```
