---
name: jira
description: Create, edit, assign, transition, search, and verify Jira issues via the Atlassian MCP server.
disable-model-invocation: true
---

# Jira

Manage Jira issues through the Atlassian MCP server. Keep mutations explicit:
only create, edit, assign, or transition issues when requested.

## Environment variables

Inspect the environment before prompting the user for configuration:

- `JIRA_BASE_URL` (or `ATLASSIAN_BASE_URL`): Jira site URL or hostname (e.g.
  `https://example.atlassian.net` or `example.atlassian.net`).
- `JIRA_DEFAULT_PROJECT` (or `JIRA_DEFAULT_SPACE`, `JIRA_PROJECT`): Default
  project or space key (e.g. `PROJ`).
- `JIRA_DEFAULT_ISSUE_TYPE`: Default work type (defaults to `Task`).

Strip trailing slashes and normalize URLs. If `JIRA_BASE_URL` lacks a protocol,
use the raw hostname for `cloudId` and prepend `https://` when constructing
browse URLs.

## Workflow

### 1. Determine operation from user prompt

Infer the primary operation from the user's instructions:

- **Create:** User asks to create, file, open, or draft a new issue, or provides
  requirements without specifying an existing issue key.
- **Edit / Update:** User references an existing issue key (e.g. `PROJ-123`) or
  asks to modify, append, update, or change an existing ticket.
- **Assign:** User asks to assign an issue to themselves or someone else.
- **Transition:** User asks to move status (e.g. "start", "close", "in review").
- **Search / Inspect:** User asks to look up, list, or inspect issues.

If the prompt is ambiguous between creating a new issue and editing an existing
one, ask for clarification before mutating Jira.

### 2. Resolve site and cloudId

1. If `JIRA_BASE_URL` or an issue/project URL is provided, extract the hostname
   (e.g. `example.atlassian.net`). Pass this hostname as `cloudId`.
2. If no URL or hostname is known, call
   `atlassian_getAccessibleAtlassianResources` to retrieve accessible sites and
   their `cloudId` values.
3. If multiple resources are returned and no environment variable matches, ask
   the user which site to use.

### 3. Resolve project and issue type

1. **Project / Space:**
   - Extract project key from user prompt or issue key if present.
   - If missing, use `JIRA_DEFAULT_PROJECT` (or `JIRA_DEFAULT_SPACE`).
   - If still unknown, call `atlassian_getVisibleJiraProjects` and prompt the
     user.
2. **Issue Type / Work Type:**
   - Use explicit type requested in prompt (e.g. Bug, Story, Epic, Spike).
   - Otherwise, check `JIRA_DEFAULT_ISSUE_TYPE`.
   - Default to `Task` if unset.
   - Call `atlassian_getJiraProjectIssueTypesMetadata` with `projectIdOrKey`.
     Verify the selected type exists for the project. If not, prompt the user
     with the project's valid types. Note the `id` of the chosen issue type.

### 4. Detect custom Acceptance Criteria field

Jira instances often have a dedicated custom field for Acceptance Criteria.
Check for this field before formatting the description body:

1. **For existing issues:** If the issue has already been fetched, inspect its
   `names` map (returned by `atlassian_getJiraIssue` when `names` is expanded)
   for any key matching "Acceptance Criteria" (case-insensitive) to discover
   the custom field ID without an extra API call.
2. **For new issues (or if unset):** Call
   `atlassian_getJiraIssueTypeMetaWithFields` with:
   - `cloudId`
   - `projectIdOrKey`
   - `issueTypeId`
   - `requiredFieldsOnly: false` (MANDATORY: setting this to `true` hides
     optional custom fields).
   Scan returned fields for any field whose `name` matches "Acceptance Criteria".
3. **If an Acceptance Criteria custom field is found:**
   - Record its field key (e.g. `customfield_10023`).
   - Note that Jira Cloud rich-text custom fields require an Atlassian Document
     Format (ADF) object rather than a raw Markdown string:
     ```json
     {
       "type": "doc",
       "version": 1,
       "content": [
         {
           "type": "bulletList",
           "content": [
             {
               "type": "listItem",
               "content": [
                 {
                   "type": "paragraph",
                   "content": [{ "type": "text", "text": "First criterion" }]
                 }
               ]
             }
           ]
         }
       ]
     }
     ```
   - On create: pass the ADF object inside `additional_fields`
     (`{ "<customfield_id>": <adf_object> }`).
   - On edit: pass the ADF object inside `fields`
     (`{ "<customfield_id>": <adf_object> }`).
   - **Do not** add an `## Acceptance Criteria` section to the description body.
4. **If no Acceptance Criteria custom field exists:**
   - Append an `## Acceptance Criteria` section directly within the Markdown
     description body.

### 5. Search for duplicates before creating

Before creating a new issue:

1. Search with `atlassian_searchJiraIssuesUsingJql`:
   - Construct a targeted JQL query, e.g.:
     `project = "<KEY>" AND text ~ "<keywords>"`
2. If matching or duplicate issues appear, stop and show them to the user before
   creating a new ticket.

### 6. Create an issue

Draft the summary and description:

- **Summary (Title):** Focus strictly on the **consequence, user benefit, or
  why this matters**, NOT the implementation mechanics (what/how belongs in
  the ticket body under Approach).
  - **Apply the "So What?" test:** A reader glancing at the summary on a board
    should immediately understand what improves without opening the ticket. If
    you ask "So what? / Why does this matter?", the summary must already answer
    it.
  - *Reject mechanical summaries (WHAT):* "Add Makefile root targets", "Create
    Go CLI tool", "Add caching layer".
  - *Require value/consequence (WHY):* "Reduce setup friction and Makefile
    drift across AI Assistant", "Eliminate redundant auth lookups to cut p99
    latency".
- **Description structure (Markdown):**

````markdown
## Problem

Current pain, risk, or missing capability.

## Goal

Target outcome for users or maintainers.

## Approach

- Implementation boundaries and constraints.
- State what will not change.

## Outcome

Practical benefit in one short paragraph.
````

*(Only include `## Acceptance Criteria` in the description if step 4 found no
dedicated custom field).*

Call `atlassian_createJiraIssue` with:

- `cloudId`
- `projectKey`
- `issueTypeName`
- `summary`
- `description`
- `contentFormat: "markdown"`
- `assignee_account_id` (if assigning at creation; see Step 8)
- `additional_fields` (for custom fields like Acceptance Criteria, labels, or
  components)

### 7. Edit an existing issue

1. Fetch the issue first using `atlassian_getJiraIssue`. Omit `fields` to
   retrieve default standard fields (summary, description, status, etc.) or pass
   only the specific fields needed (e.g. `fields: ["summary", "description"]`).
   Never pass `fields: ["*all"]` unless doing an exhaustive audit, as it returns
   hundreds of irrelevant custom fields and drains context tokens.
2. Preserve existing fields and text unless explicitly asked to overwrite.
3. Call `atlassian_editJiraIssue`:
   - Pass updated standard fields in `fields` (e.g. `summary`, `description`).
     If updating `summary`, ensure it focuses on consequence/value (see Step 6).
   - Pass custom fields (such as Acceptance Criteria in ADF) in `fields` using
     their `customfield_*` ID.
   - To clear a field, pass explicit `null`.

### 8. Assign an issue

If the user says "assign it to me" or asks to assign:

1. Call `atlassian_atlassianUserInfo` to get the current user's `account_id`.
2. If assigning during creation: pass `assignee_account_id: "<account_id>"`.
3. If assigning an existing issue: call `atlassian_editJiraIssue` with:

```json
{
  "fields": {
    "assignee": {
      "accountId": "<account_id>"
    }
  }
}
```

4. If assigning to another person by name or email, resolve their account ID
   first with `atlassian_lookupJiraAccountId`.

### 9. Transition status

Never hardcode or guess a transition ID:

1. Call `atlassian_getTransitionsForJiraIssue(cloudId, issueIdOrKey)`.
2. Match the transition whose `name` corresponds to the target status (e.g. "In
   Progress", "Done").
3. Call `atlassian_transitionJiraIssue` with:

```json
{
  "transition": {
    "id": "<transitionId>"
  }
}
```

### 10. Verify every mutation

After creating, editing, or transitioning:

1. For edits modifying only standard fields, `atlassian_editJiraIssue` already
   returns the updated issue payload—verify against that response without
   making an extra API call.
2. If verifying custom fields or a transition, call
   `atlassian_getJiraIssue(cloudId, issueIdOrKey)` passing only the mutated
   fields in `fields` plus `status` and `assignee`. Never use
   `fields: ["*all"]`.
3. Verify updated fields (summary, description, custom fields, assignee, status).
4. Report the result clearly:
   - Issue key (e.g. `PROJ-123`).
   - Browse URL: `https://<site-hostname>/browse/<issueKey>`.
   - Assignee and status.

## Failure handling

- If project or issue type cannot be resolved, prompt the user with available
  options.
- If field discovery fails or `requiredFieldsOnly: false` is not supported, fall
  back safely to formatting acceptance criteria in the description body.
- If a duplicate issue is detected, prompt the user before proceeding.
- If transition fails or the requested status is not available from the current
  state, display available transition names.
- Never report an action succeeded without verifying the read-back.
