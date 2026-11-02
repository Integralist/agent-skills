# Agent Teams — Enablement

When the harness supports named, parallel agent teams, use them to run
independent work concurrently instead of sequentially.

On Claude Code, enable agent teams by adding this to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
