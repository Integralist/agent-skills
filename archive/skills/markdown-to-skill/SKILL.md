---
name: markdown-to-skill
description: >-
  Convert a directory of Markdown files into agent skills. Use when the user
  wants existing Markdown docs turned into skills, globally or for one
  project.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Markdown to Skill Converter

Turn each Markdown file in a directory into its own skill: a `SKILL.md` with
generated frontmatter and the file's content as the body, written either
globally (the harness's skills directory, such as `~/.agents/skills/` or
`~/.claude/skills/`, for every project) or locally (`.agents/skills/` or
`.claude/skills/`, for this project only).

1. **Ask for the source and destination:** the source directory (`.`,
   `docs/`, or another path) and global or local. Done when both are known.
2. **Scan.** Find every `**/*.md` in the source except existing `SKILL.md`
   files, and note any top-level directory that looks like a domain (it
   contains a `.`, such as `docs.example.com`): its files get a scope prefix.
   Done when the file list is complete.
3. **Preview** each file's source path, skill name, and status, and wait for
   the user to confirm:

   ```txt
   | Source file                               | Skill name                  | Status                 |
   | ----------------------------------------- | --------------------------- | ---------------------- |
   | guides/my-guide.md                        | my-guide                    | Will create            |
   | setup.md                                  | setup                       | Conflict: skill exists |
   | docs.example.com/guides/getting-started.md | example-docs:getting-started | Will create          |
   ```

   Done when the user confirms.
4. **Convert** each file, skipping a conflict unless the user confirmed
   overwriting it:
   - **Name:** the filename without `.md` or its path, lowercased, with
     spaces and underscores as hyphens (`guides/My_Guide File.md` →
     `my-guide-file`). Under a domain directory, prefix the scope as
     `<scope>:<name>`: `docs.X.com` or `X.docs.com` → `X-docs`, `www.X.com`
     → `X-www`, `developer.X.org` → `X-developer`, otherwise the main domain
     then the subdomain (`api.github.com` → `github-api`). The same filename
     under two scopes makes two skills.
   - **Description:** an existing frontmatter `description`, else the first
     `# Heading` or first paragraph, cut to about 100 characters, else
     `Skill converted from <original-filename>`.
   - **Write** `<skills-dir>/<name>/SKILL.md`, replacing any existing
     frontmatter, with `<tier>` chosen by the
     [model tier rules](../../../.agents/skills/writing-for-agents/SKILL-MECHANICS.md#model-tier):

     ```md
     ---
     name: <name>
     description: <description>
     metadata:
       model-tier: <tier>
     ---

     <original content, minus old frontmatter>
     ```

   - **Skip with a warning** any file that isn't UTF-8 or is over 1 MB.

   Done when every confirmed file is converted or skipped with a reason.
5. **Report** the destination, the number created, each skip or error with
   its reason, and the new skills by name. Done when the report is
   delivered.

**Parallel apply.** Conversion is the same transform per file, so it suits a
[verified-pattern fan-out](../../../.agents/skills/shared/SUBAGENT-STEERABILITY.md): convert the
first file yourself and show the result, and once the user approves its
name, description, and frontmatter, have subagents convert the rest, one per
file or batch, under the same step 4 rules. The user approves the transform
once, not per file. Follow the shared completion and retry protocol,
retrying only unfinished files.

**Example.** `docs/deployment-guide.md`:

````md
---
author: Jane Doe
date: 2024-01-15
---

# Deploying to Production

This guide covers the steps to deploy our application to production.
````

becomes `<skills-dir>/deployment-guide/SKILL.md`:

````md
---
name: deployment-guide
description: Deploying to Production - This guide covers the steps to deploy our application to production.
metadata:
  model-tier: moderate
---

# Deploying to Production

This guide covers the steps to deploy our application to production.
````
