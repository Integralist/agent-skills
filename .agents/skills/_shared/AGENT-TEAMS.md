# Agent Teams — Enablement

If your harness supports named, parallel agent teams, use them to
run independent work concurrently rather than sequentially.

On Claude Code, enable agent teams by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
