---
name: council
description: >-
  Run a read-only second-opinion code review across Copilot, Vertex, and
  Bedrock models using Pi subagents.
disable-model-invocation: true
argument-hint: "[--branch | --uncommitted | --all-changes | --target=<path|pr-url>] [steering]"
metadata:
  model-tier: complex
---

Get an independent, read-only second opinion on a code change from three
different model providers (`github-copilot`, `google-vertex`, and
`amazon-bedrock`), always avoiding the model currently active in this session.
**Never edit code, change git state, or post PR comments.**

## Pre-flight checks

1. **Require `pi-subagents`.** Verify `spawn_inline_subagent` and
   `get_subagent_result` are available in this session. If missing, stop and
   tell the user to install `git:github.com/Integralist/pi-subagents` and
   reload Pi.
2. **Identify the active model.** Read `$PI_PROVIDER` and `$PI_MODEL`. If
   auto-routed (`pi-auto-model/auto`), check which physical model ran (or ask
   if unknown). Strip any Bedrock `global.` prefix when comparing model IDs so
   `anthropic.claude-opus-5-5` matches `global.anthropic.claude-opus-5-5`.

## Choose the review target

Accept these source arguments in any position, plus optional focus
instructions:

| Argument | Source |
| --- | --- |
| `--target=<pr-url>` or `--target=<owner/repo#number>` | Remote PR via `gh pr view` and `gh pr diff` |
| `--branch` | Local branch commits vs. default branch (`main`, `master`, or `origin/HEAD`) |
| `--uncommitted` | `git diff HEAD` plus untracked files (`git ls-files --others --exclude-standard`) |
| `--all-changes` | `git diff "$BASE"` plus untracked files against default branch |
| `--target=<path>` or `--target=<glob>` | Explicit files plus `git diff HEAD -- <paths>` |

If no source argument is given:

- If only uncommitted changes exist, use `--uncommitted`.
- If the working tree is clean and the branch is ahead of the default branch,
  use `--branch`.
- If both exist, ask the user which target to review.
- If neither has changes, report "No changes to review" and stop.

Write the diff once to a temp file (`DIFF_PATH` under `$TMPDIR`) alongside the
changed-file list (appending `git diff --no-index /dev/null <file>` for
untracked files) so all subagents review the exact same snapshot. For PR or
`--branch` reviews, warn reviewers if the local working tree differs from
`headRefOid` or `HEAD` (or extract changed files at that revision into temp
files). If the diff is empty and no files match, report "No changes to review"
and stop.

## Select one model per provider

Pass `allow_model_fallback: false`, `thinking: "high"`, `max_turns: 40`, and
read-only tools (`["read", "grep", "find", "ls"]`) to every
`spawn_inline_subagent` call so an unavailable model fails loudly instead of
silently reusing the active model. (If Copilot models fail as unavailable,
note that `make install-pi PI_MODELS=true` installs `.pi/agent/models.json`.)

| Provider | Default model | Alternate when default is active |
| --- | --- | --- |
| `github-copilot` | `github-copilot/gpt-6.2-astra` | `github-copilot/gpt-6.2-sol` |
| `google-vertex` | `google-vertex/gemini-4-carbon` | `google-vertex/gemini-4-hydrogen` |
| `amazon-bedrock` | `amazon-bedrock/global.anthropic.claude-opus-5-5` | `amazon-bedrock/global.anthropic.claude-sonnet-5-5` |

Use Claude models only on `amazon-bedrock` (never GPT on Bedrock), and swap
between `gemini-4-carbon` and `gemini-4-hydrogen` on `google-vertex` (never
`gemini-4-argon`).

## Launch subagents and handle Bedrock auth

1. **Check Bedrock auth non-interactively.** Run:

   ```bash
   aws sts get-caller-identity --profile bedrock >/dev/null 2>&1
   ```

2. **Start Copilot and Vertex right away.** Spawn the `github-copilot` and
   `google-vertex` subagents immediately via `spawn_inline_subagent`. If step 1
   did not succeed, pass `wake_on_finish: false` on both so background
   completion does not interrupt the user while they log in. Give each a
   concise `system_prompt` (independent, read-only senior reviewer; cite
   `path:line`; end with `COMPLETE` or `INCOMPLETE` plus any skipped files).
   In `prompt`, pass `DIFF_PATH`, the changed-file list, any user focus note,
   and ask what is missing, wrong, risky, or overlooked.
3. **Handle Bedrock.**
   - If step 1 succeeded, spawn the `amazon-bedrock` subagent immediately too.
   - If step 1 did not succeed, alert the user that Bedrock requires
     authentication, tell them to run `aws sso login --profile=bedrock`
     (noting a browser window will open), and wait for their go-ahead before
     spawning the `amazon-bedrock` subagent. If they prefer to skip Bedrock,
     proceed with the two running models.

## Verify and synthesize

Collect every spawned subagent with `get_subagent_result` (if it returns
"still working", wait and poll again, or let the user cancel). Check claimed
defects against the actual diff and files so false positives are not passed
along as facts, then report:

1. **Agreements:** Confirmed bugs, gaps, or risks raised by multiple models.
2. **Unique findings and disagreements:** Notable catches or differing takes
   attributed to each model.
3. **Coverage gaps:** Any skipped, unverified, or unsuccessful provider run.
4. **Next step:** One concise recommendation (do not edit files or open a PR).
