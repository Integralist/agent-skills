# GitHub Operations for PR Monitoring

Use these commands to inspect PR state, reply to inline threads, resolve
addressed threads, maintain the single amendment log comment, detect review
bot caps, and monitor CI and delayed bot reviews.

Replace `<owner>`, `<repo>`, `<pr>`, `<sha>`, and IDs with values from the
resolved pull request. Never hard-wrap prose posted to GitHub; write each
paragraph and list item on a single line.

## 1. Resolve PR and verify checkout

```bash
gh pr view <pr> --json number,url,title,state,headRefName,headRefOid,baseRefName,reviewDecision,reviewRequests
git symbolic-ref --quiet --short HEAD
git status --porcelain
```

Stop if `state` is not `OPEN`, the checked-out branch differs from
`headRefName`, or `git status --porcelain` is non-empty. Extract `<owner>` and
`<repo>` from `gh repo view --json nameWithOwner --jq .nameWithOwner` (or from
the PR URL when targeting another repository).

## 2. Inspect CI checks and review feedback

### CI status and failure logs

```bash
gh pr checks <pr> --json name,state,bucket,link,completedAt
```

For each failing check backed by GitHub Actions, extract its run ID from
`link` and fetch failed step output:

```bash
gh run view <run-id> --log-failed
```

### Unresolved inline review threads (GraphQL)

Fetch unresolved threads with their GraphQL node `id` (needed for
`resolveReviewThread`) and first comment `databaseId` (needed for inline
replies):

```bash
gh api graphql -F owner="<owner>" -F name="<repo>" -F pr=<pr> -f query='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first: 20) {
            nodes {
              databaseId
              author { login }
              body
              createdAt
              url
            }
          }
        }
      }
    }
  }
}'
```

Paginate with `after: $cursor` if `pageInfo.hasNextPage` is true.

### Top-level reviews and issue comments

```bash
gh api repos/<owner>/<repo>/pulls/<pr>/reviews --paginate \
  --jq '.[] | {id, user: .user.login, state, submitted_at, body}'
gh api repos/<owner>/<repo>/issues/<pr>/comments --paginate \
  --jq '.[] | {id, user: .user.login, created_at, updated_at, body}'
```

## 3. Reply inline and resolve threads

### Reply in an inline review thread

Use the root comment's `databaseId` from the GraphQL query. Inline replies
notify thread participants directly:

Write the reply to a temp file (avoids shell-escaping backticks and quotes)
and post it:

```bash
gh api "repos/<owner>/<repo>/pulls/<pr>/comments/<database-id>/replies" \
  -F body=@<file>
```

### Resolve an addressed thread

Resolve threads whose concern was fixed or confirmed non-blocking. Leave
disputed push-backs open so the reviewer can confirm:

```bash
gh api graphql -F threadId="<thread-node-id>" -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { id isResolved }
  }
}'
```

## 4. Notify reviewers without an inline thread

When feedback came from a top-level review body or PR issue comment (where
inline replies are not possible), post a **new** top-level comment
`@`-mentioning that reviewer or bot so GitHub delivers a notification. Never
rely on editing an existing comment to send a notification.

Write the body to a temp file and post it:

```bash
gh pr comment <pr> --body-file <file>
```

Keep it direct and structured—for example:

```md
@<reviewer> Addressed the feedback in [`<short-sha>`](https://github.com/<owner>/<repo>/commit/<full-sha>):

**Blocking**
1. **<Item>:** <What changed and where.>

**Non-blocking**
1. <What changed.>
```

## 5. Maintain the single amendment log comment

Keep one running amendment log on the PR so readers can scan every round in
one place without digging through bot chatter. Find an existing log comment
by its hidden marker:

```bash
gh api repos/<owner>/<repo>/issues/<pr>/comments --paginate \
  --jq '.[] | select(.body | contains("<!-- pr-monitor:log -->")) | {id, body}'
```

- **First round (no existing comment):** Post a new comment with
  `gh pr comment <pr> --body-file <file>`.
- **Subsequent rounds:** Append the new round section to the existing body and
  update it in place via `PATCH`:

```bash
gh api --method PATCH "repos/<owner>/<repo>/issues/comments/<comment-id>" \
  -F body=@<file>
```

Do not include `@mentions` in edited updates; treat this comment purely as the
consolidated amendment log. Use this shape (each bullet on one unwrapped line):

```md
<!-- pr-monitor:log -->
## PR Amendment Log

### Round 1 — [`<short-sha>`](https://github.com/<owner>/<repo>/commit/<full-sha>)
- **CI fixes:** <Fixed check and cause, or omit if none.>
- **Blocking:** <Summary of blocking review fixes, or omit if none.>
- **Non-blocking:** <Summary of non-blocking fixes, or omit if none.>
- **Push-backs:** <Items pushed back with reason, or omit if none.>
- **Threads:** Resolved <N> inline threads (<M> remaining open).
```

## 6. Detect automated review-bot caps and triggers

Some repositories cap automatic review runs per PR and require a manual
comment to trigger additional reviews. Never hardcode a repo-specific bot name,
cap, or trigger command. Instead, inspect live signals before waiting:

1. Check existing PR issue comments and check-run output for run-limit notices
   (such as `5 of 5 complete`, `automatic review limit reached`, or similar)
   and an explicit manual trigger instruction (such as mentioning `@<handle>`
   or posting `/<command>`).
2. If unclear, inspect `.github/workflows/*.yml` for `issue_comment` triggers
   that run a review workflow.
3. Only post a manual trigger comment when both a reached cap (or skipped
   automatic run) and an explicit trigger phrase are directly observed. Post it
   as a **new** comment after pushing, at most once per push.

## 7. Monitor CI and delayed review bots

Record the pushed commit SHA and push timestamp (`date -u +%Y-%m-%dT%H:%M:%SZ`)
immediately after `git push`.

1. **Wait for active CI checks:**
   - Prefer `gh pr checks <pr> --watch --interval 15` (if checks have not
     registered yet right after push, wait 10–15 seconds and re-check once
     before concluding there are no checks).
   - Where `gh event listen` is enabled on `github.com`, you may also listen
     for `com.github.pull_request.check_suite.status.changed.v1` and
     `com.github.pull_request.review.submitted.v1`, then re-read PR state
     immediately after attaching and on each event.
2. **Post-CI window for delayed review bots:** After CI checks settle, poll
   every 30 seconds for new reviews, inline comments, issue comments, or check
   runs created after the push timestamp:
   - **No bot pending:** If no bot check is running/queued and no bot reviewer
     appears in `reviewRequests`, stop after **2 minutes** of quiet time past
     CI completion.
   - **Bot pending:** If a review bot check is queued/in-progress or a bot
     reviewer is still requested, keep polling until it completes or posts—up
     to **10 minutes** past CI completion (or `--post-ci-wait=<minutes>`).
   - **Early exit:** Stop waiting as soon as a new failing check or new
     actionable review feedback appears for the pushed commit.
