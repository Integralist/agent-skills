---
name: jira
description: >-
  Create, edit, assign, transition, search, and verify Jira issues through the
  Atlassian MCP server. Use when the user asks to file, update, assign, move,
  or look up a Jira issue.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

# Jira

Manage Jira issues through the Atlassian MCP server. Change an issue only in
the way the user asked, and report a change as done only after reading it
back.

**Configuration.** Check the environment before asking the user:
`JIRA_BASE_URL` (or `ATLASSIAN_BASE_URL`) for the site, such as
`example.atlassian.net`; `JIRA_DEFAULT_PROJECT` (or `JIRA_DEFAULT_SPACE`,
`JIRA_PROJECT`) for the project key; and `JIRA_DEFAULT_ISSUE_TYPE`, which
defaults to `Task`. Strip trailing slashes. The bare hostname is the
`cloudId`; browse URLs are `https://<hostname>/browse/<KEY>`.

1. **Pick the operation:** create (a new issue, or requirements with no issue
   key), edit (an existing key such as `PROJ-123`, or a change to one),
   assign, transition (a status change such as "start" or "close"), or
   search. If it could be create or edit, ask before changing anything. Done
   when you know the operation.
2. **Resolve the site.** Use the hostname from `JIRA_BASE_URL` or a URL the
   user gave. Otherwise call `atlassian_getAccessibleAtlassianResources`, and
   ask which site if it returns several and none matches the environment.
   Done when you have a `cloudId`.
3. **Resolve the project and type** (for create). Take the project from the
   prompt or issue key, then the environment, then
   `atlassian_getVisibleJiraProjects` and the user. Take the type from the
   prompt (Bug, Story, Epic, Spike), then `JIRA_DEFAULT_ISSUE_TYPE`, then
   `Task`, and check it exists with
   `atlassian_getJiraProjectIssueTypesMetadata`; if it doesn't, offer the
   project's valid types. Done when you have the project key and the type's
   `id`.
4. **Find the Acceptance Criteria field.** For a fetched issue, look in the
   `names` map from `atlassian_getJiraIssue` for a key matching "Acceptance
   Criteria", case-insensitively. Otherwise call
   `atlassian_getJiraIssueTypeMetaWithFields` with `cloudId`,
   `projectIdOrKey`, `issueTypeId`, and `requiredFieldsOnly: false`, since
   `true` hides optional custom fields. Done when you have its
   `customfield_*` key, or know there isn't one; if discovery fails, treat it
   as none.
5. **Check for duplicates** before creating, with
   `atlassian_searchJiraIssuesUsingJql` and a query like
   `project = "<KEY>" AND text ~ "<keywords>"`. Done when none match, or
   you've shown the matches and the user has said to go ahead.
6. **Make the change:**
   - **Create** with `atlassian_createJiraIssue`, passing `cloudId`,
     `projectKey`, `issueTypeName`, `summary`, `description`,
     `contentFormat: "markdown"`, and, as needed, `assignee_account_id` and
     `additional_fields` for custom fields, labels, and components.
   - **Edit:** fetch the issue with only the fields you need (omit `fields`
     for the defaults, and never use `["*all"]`, which floods the context
     with custom fields). Keep existing text and fields unless asked to
     overwrite them. Call `atlassian_editJiraIssue` with standard and
     `customfield_*` fields in `fields`, and `null` to clear one.
   - **Assign:** for "me", get the `account_id` from
     `atlassian_atlassianUserInfo`; for anyone else, resolve it with
     `atlassian_lookupJiraAccountId`. Pass `assignee_account_id` on create,
     or `{"fields": {"assignee": {"accountId": "<id>"}}}` on edit.
   - **Transition:** never guess a transition ID. Get them from
     `atlassian_getTransitionsForJiraIssue`, match the target status by
     name, and call `atlassian_transitionJiraIssue` with
     `{"transition": {"id": "<id>"}}`. If the status isn't reachable from
     the current one, show the available transition names.

   Done when the call succeeds.
7. **Verify and report.** For an edit of standard fields only, check the
   issue `atlassian_editJiraIssue` returned. Otherwise call
   `atlassian_getJiraIssue` with just the changed fields plus `status` and
   `assignee`. Done when the read-back matches and you've reported the key,
   browse URL, assignee, and status.

**Summary.** State the consequence or benefit, not the mechanics, which go
under Approach: someone glancing at the board should see what improves
without opening the issue.

```txt
BAD:  Add caching layer
GOOD: Eliminate redundant auth lookups to cut p99 latency
```

**Description,** in Markdown:

````md
## Problem

Current pain, risk, or missing capability.

## Goal

Target outcome for users or maintainers.

## Approach

- Implementation boundaries and constraints.
- What will not change.

## Outcome

Practical benefit in one short paragraph.
````

**Acceptance criteria.** With a custom field, put them there and not in the
description. Jira Cloud rich-text fields need Atlassian Document Format, not
Markdown: pass the object in `additional_fields` on create, or in `fields` on
edit, as `{"<customfield_id>": <adf>}`. Without a custom field, add an
`## Acceptance Criteria` section to the description.

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
