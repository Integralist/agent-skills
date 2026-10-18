---
name: is-it-safe
description: >-
  Find the worst credible consequence of committing or merging a code change.
  Use when the user asks whether the current branch, a commit or range, or a
  pull request is safe to commit or merge.
disable-model-invocation: true
argument-hint: "[PR URL | PR number | commit/range | base ref]"
metadata:
  model-tier: complex
---

# Is It Safe?

Answer one question: what's the worst credible outcome if these exact changes
are committed or merged? Trace one concrete failure path and its impact. This
is adversarial impact analysis, not a code review or a risk matrix, so report
the strongest evidence-backed concern rather than a catalogue of hypotheticals.

**Read-only.** Edit, approve, commit, push, or merge nothing; post a PR comment
only after the user approves it in step 6. Judge consequences and
reachability, not style or maintainability. A test gap isn't proof of a
defect, a passing suite isn't proof of safety, and no verdict claims absolute
safety: say what you inspected and what supports the verdict.

1. **Start the clock.** Record `date +%s` at the start, and again just before
   writing the report, and report the elapsed wall-clock time for every
   outcome, including `UNKNOWN` and "nothing pending". If no reliable clock is
   available, say timing couldn't be measured rather than estimating. Done
   when the start time is recorded.
2. **Resolve the change** under review:
   - **No argument:** the current branch and worktree against the branch's
     upstream: unpushed commits, staged and unstaged tracked changes, and
     untracked non-ignored files, keeping committed and worktree changes
     distinct. On the default branch, compare local `HEAD` with its
     remote-tracking upstream (local `main` with `origin/main`), never the
     branch with itself. With no upstream, use a remote default-branch ref
     only when it's identifiable and a sound baseline. Use local refs, and say
     a remote-tracking ref may be stale. If nothing is pending, say so and ask
     for a commit, range, or PR; never assume the latest commit is the target.
   - **PR URL or number:** review that PR's actual diff, not the checkout:

     ```sh
     gh pr view "$PR" --json \
       number,title,state,baseRefName,headRefName,baseRefOid,headRefOid,url
     gh pr diff "$PR"
     ```

     Use `gh api` only for what those can't give, and check the endpoint's
     response semantics first: a 404 from a branch-protection endpoint can
     mean the branch isn't protected, not that it's missing. Encode a
     slash-containing branch name used as one REST path parameter, or list
     branches and filter for an exact match, and prefer the PR's head
     metadata to assuming a branch exists. In jq, use `contains("text")` for
     substrings (`"\."` is an invalid string escape). A failed request or jq
     expression is a failed query, not evidence; fix it if the answer
     matters, and return `UNKNOWN` naming the missing access if the PR still
     can't be read.
   - **Commit, range, or base ref:** exactly that target. Add no worktree
     changes to an explicit range; for a base ref, compare it with `HEAD`
     plus worktree changes, naming each scope in the report.

   Done when the exact diff and baseline are identified, or the report says
   why they couldn't be.
3. **Trace the worst credible outcome.** Read the full diff, its intent, and
   the files it touches, following callers, consumers, invariants,
   configuration, or deploy and rollback paths only where they could change
   the verdict. Scale to the diff (a few-line change needs a handful of
   lookups), batch independent reads, and reuse evidence. Search for paths to
   material harm, such as data loss or corruption, unauthorised access or
   disclosure, broad availability or performance failure, broken
   compatibility, or irreversible external effects, as prompts rather than a
   checklist for the report. For the strongest candidate, trace **trigger →
   changed behaviour → affected system or users → consequence**, with its
   preconditions, blast radius, and guards or recovery paths from evidence. A
   dramatic outcome with no reachable, evidenced path is speculation: drop it
   or name the unresolved condition. Done when the strongest candidate has a
   concrete trigger and causal path.
4. **Try to disprove it** through callers, validation, feature gates, tests,
   and safeguards.
   - Run a targeted test only when it answers a material question and you've
     confirmed, from runner configuration or authoritative docs, that it runs
     in a disposable sandbox with no access to host files outside the
     checkout, host credentials, or production. Otherwise skip it and say
     why.
   - When the candidate depends on cross-module callers or safeguards, have
     one independent read-only subagent try to refute that exact path,
     following [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md).
     Give it the resolved revision and diff, the candidate chain, scoped
     paths, and known evidence. Grant only verified read-only tools (no
     tests, edits, or remote writes) and a 40-turn budget. Require
     `COMPLETE` or `INCOMPLETE`, the paths inspected, cited safeguards and
     counterevidence, and unknowns. Verify decisive evidence yourself and
     keep the verdict in the main thread; if delegation isn't available,
     say so and do the disproof yourself.

   Cite evidence as `path/to/file.ext:line`, and separate verified facts from
   assumptions, naming any unknown rather than guessing. Done when the
   candidate is confirmed or refuted, safeguards are checked, and
   decision-relevant unknowns are explicit; stop there, since more breadth
   doesn't raise confidence.
5. **Report** using the template below, verdict first. Done when the report
   is delivered.
6. **Offer a PR comment.** For a PR, end by asking "💬 Should I post a review
   comment to the PR?" and post nothing unless the user says yes. Then post
   one top-level comment, not inline ones, opening with this line and
   followed by the verdict and its sections, without Model and Elapsed:

   ```txt
   🤖 This review was written by an LLM agent (`<model ID>`, <effort> effort).
   ```

   If the PR can't be reached or the post fails, say so. Done when the user
   has answered and any approved comment is posted.

## Verdicts

Pick one from the evidence, with no numeric score or impact matrix, and keep
the coloured marker beside it, since Markdown can't colour the word:

- 🟢 **PROCEED:** no concrete material failure path in the inspected scope,
  which isn't a guarantee of no risk.
- 🟡 **HOLD:** a credible material risk needs mitigation or an explicit
  decision first, but nothing establishes a release-blocking outcome.
- 🔴 **STOP:** evidence establishes a severe, release-blocking consequence
  with no effective safeguard; recommend against committing or merging until
  it's fixed.
- ⚪ **UNKNOWN:** the target, source, or critical behaviour couldn't be
  assessed reliably. Name the missing access or evidence; this claims neither
  safe nor unsafe.

## Report

Keep it short. Apply [voice-product](../voice-product/SKILL.md) to the
explanation: plain language for a human who may act on it, naming who does
what, under which condition, with what observable impact, and explaining
unfamiliar terms. Keep the causal path, preconditions, `path:line` evidence,
uncertainty, and mitigation so another agent can act on it. Lead with the
single worst outcome, add another only if it's independently material, and
don't pad a PROCEED with generic risks.

```txt
BAD:  Contributor-controlled test code could expose credentials.
GOOD: If we run the PR's test without isolation, code from the PR runs on the
      test machine. It could read credentials stored there or change files
      that account can reach. Run it only in an isolated environment without
      credentials; otherwise, skip it.
```

For Model, give the session's exact model ID and effort, read from
`$CLAUDE_EFFORT` in Claude Code or `$PI_REASONING_LEVEL` in Pi, or
`effort unknown` if neither is set. Use the sections for your verdict:

````md
### Verdict

🟡 **HOLD** — <one-sentence recommendation and the scope reviewed>

- **Model:** <exact model ID and effort, e.g. gemini-3.8-flash (high effort)>
- **Elapsed:** <measured duration, e.g. 2m 30s>

<!-- HOLD or STOP -->
### Worst thing that could happen
<The consequence in plain language, and who or what it affects.>
### How it could happen
<Trigger → changed behaviour → impact, with preconditions, blast radius,
and cited code and safeguards.>
### Before commit or merge
<The smallest useful mitigation, decision, or check.>

<!-- PROCEED -->
### Why no material risk was found
<Why no concrete failure path is reachable: what you checked and why the
changed behaviour stays bounded.>
### Verified safeguards
<Code, tests, configuration, or guards that keep it safe, with path:line.>

<!-- HOLD, STOP, or PROCEED; omit when there are none -->
### What I couldn't confirm
<Only unknowns that could change the verdict.>

<!-- UNKNOWN -->
### Why this could not be assessed
<The missing access, unresolvable ref, or unavailable evidence.>
### What is needed to proceed
<The input, permission, or command that would unblock the review.>
````
