---
name: markdown-to-skill
description: Convert Markdown files from a directory into agent skills.
disable-model-invocation: true
---

# Markdown to Skill Converter

Convert Markdown files from a user-specified directory into valid agent
skills, written to one of two locations:

- **Global** — the harness's global skills dir (e.g. `~/.agents/skills/`
  or `~/.claude/skills/`); available in all projects.
- **Local** — the project skills dir (e.g. `.agents/skills/` or
  `.claude/skills/`); available only in this project.

## Workflow

### Step 1: Get source and destination

Ask the user:

1. **Source directory** — options: current dir (`.`), `docs/`, or other
   (let the user specify).
1. **Destination** — Global or Local (as above).

### Step 2: Detect directory structure

Before scanning, use `ls`/`Glob` to check the source for
website-scoped subdirectories: top-level dirs that look like domain
names (contain `.`, e.g. `docs.example.com`). If found, skill names get
a scope prefix derived from the domain (see Step 5).

### Step 3: Scan for Markdown files

`Glob` for `**/*.md` recursively. Exclude files that are already
SKILL.md.

### Step 4: Preview conversions

Show a table of source path, proposed skill name (with scope prefix if
applicable), and conflict status. Ask the user to confirm before
proceeding.

```txt
| Source File                                | Skill Name              | Status                  |
|--------------------------------------------|-------------------------|-------------------------|
| guides/my-guide.md                         | my-guide                | Will create             |
| setup.md                                   | setup                   | Conflict: skill exists  |
| docs.fastly.com/guides/getting-started.md  | fastly-docs:getting-started | Will create         |
```

### Step 5: Convert each file

Skip conflicts unless the user confirms overwrite. For each file:

1. **Derive skill name.** Strip `.md`, lowercase, replace spaces and
   underscores with hyphens (`My_Guide File.md` -> `my-guide-file`).

   - **Without scoping** — use the filename only, not the path
     (`guides/setup.md` -> `setup`).
   - **With scoping** — `<scope>:<filename>`
     (`docs.fastly.com/guides/getting-started.md` ->
     `fastly-docs:getting-started`). Scope derivation:
     - `docs.X.com` or `X.docs.com` -> `X-docs`
     - `www.X.com` -> `X-www`
     - `developer.X.org` -> `X-developer`
     - otherwise combine subdomain + main domain, e.g.
       `api.github.com` -> `github-api`

1. **Extract description.** Prefer an existing frontmatter
   `description`. Otherwise use the first `# Heading` (or, if none, the
   first non-empty paragraph) as the basis, truncated to ~100 chars. If
   empty, default to `Skill converted from <original-filename>`.

1. **Strip existing frontmatter** (if the file starts with `---`) and
   replace with skill frontmatter.

1. **Create the skill directory** under the chosen destination:
   `<skills-dir>/<skill-name>/`.

1. **Write SKILL.md:**

   ```markdown
   ---
   name: <skill-name>
   description: <extracted-description>
   ---

   <original content, minus old frontmatter>
   ```

### Step 6: Report results

Report the destination, count of skills created, files skipped (with
reasons, e.g. conflicts), errors, and the list of new skills (invokable
as `/<skill-name>`, e.g. `/fastly-docs:getting-started`).

## Conversion rules

| Source                                    | Skill property                                       |
| ----------------------------------------- | ---------------------------------------------------- |
| Filename (`my-guide.md`)                  | `name: my-guide`                                     |
| Domain dir + filename                     | `name: scope:filename` (e.g. `fastly-docs:my-guide`) |
| First `# Heading` or first paragraph      | `description` (max ~100 chars)                       |
| Full file content (minus old frontmatter) | Body of SKILL.md                                     |

## Edge cases

- **Existing frontmatter** — strip and replace with skill frontmatter.
- **Skill conflicts** — warn, skip by default, override only if
  confirmed.
- **Subdirectories (no scoping)** — use only the filename, not the path.
- **Website-scoped dirs** — detect domain-like top-level dirs and prefix
  skill names.
- **Duplicate filenames across scopes** — each scope gets its own skill
  (`fastly-docs:api` vs `fastly-www:api`).
- **Empty description** — default to
  `Skill converted from <original-filename>`.
- **Non-UTF8 files** — skip with warning.
- **Files > 1MB** — skip with warning.

## Example

**Source** `docs/deployment-guide.md`:

```markdown
---
author: Jane Doe
date: 2024-01-15
---

# Deploying to Production

This guide covers the steps to deploy our application to production.
...
```

**Output** `<skills-dir>/deployment-guide/SKILL.md`:

```markdown
---
name: deployment-guide
description: Deploying to Production - This guide covers the steps to deploy our application to production.
---

# Deploying to Production

This guide covers the steps to deploy our application to production.
...
```

With website scoping, `docs.fastly.com/guides/getting-started.md`
becomes `<skills-dir>/fastly-docs:getting-started/SKILL.md` with
`name: fastly-docs:getting-started`, invoked as
`/fastly-docs:getting-started`.
