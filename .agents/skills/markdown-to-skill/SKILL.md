---
name: markdown-to-skill
description: Convert Markdown files from a directory into agent skills.
disable-model-invocation: true
---

# Markdown to Skill Converter

Convert Markdown files from a user-specified directory into valid agent skills.

Skills can be created in two locations:
- **Global**: your harness's global skills directory (e.g. `~/.agents/skills/`
  or `~/.claude/skills/`) — available across all projects
- **Local**: the project skills directory (e.g. `.agents/skills/` or
  `.claude/skills/`) — available only in the current project

## Workflow

### Step 1: Get Source and Destination

Prompt the user for:

**Question 1: Source directory**
```txt
Question: "Which directory contains the Markdown files to convert?"
Options:
- Current directory (.)
- docs/
- Other (let user specify)
```

**Question 2: Skill destination**
```txt
Question: "Where should the skills be created?"
Options:
- Global skills directory - Available in all projects
- Local skills directory - Available only in this project
```

### Step 2: Detect Directory Structure

First, check if the source directory contains website-scoped subdirectories:
- Look for top-level directories that look like domain names (contain `.` and match patterns like `docs.example.com`, `www.example.com`)
- If detected, skills will be prefixed with a scope derived from the domain

Use `ls` or `Glob` to examine the top-level structure before scanning for files.

### Step 3: Scan for Markdown Files

Use `Glob` to find all `*.md` files recursively in the specified directory:
- Pattern: `**/*.md`
- Exclude files that are already SKILL.md files

### Step 4: Preview Conversions

For each Markdown file found, show the user:
- Source file path
- Proposed skill name (with scope prefix if applicable)
- Whether it would conflict with an existing skill

Format as a table:

**Without website scoping:**
```txt
| Source File | Skill Name | Status |
|-------------|------------|--------|
| guides/my-guide.md | my-guide | Will create |
| docs/API_Reference.md | api-reference | Will create |
| setup.md | setup | Conflict: skill exists |
```

**With website scoping** (when domain directories detected):
```txt
| Source File | Skill Name | Status |
|-------------|------------|--------|
| docs.fastly.com/guides/getting-started.md | fastly-docs:getting-started | Will create |
| www.fastly.com/products/cdn.md | fastly-www:cdn | Will create |
| docs.fastly.com/api/endpoints.md | fastly-docs:endpoints | Will create |
```

Ask user to confirm before proceeding.

### Step 5: Convert Each File

For each Markdown file (skipping conflicts unless user confirms overwrite):

1. **Derive skill name** from filename and scope:

   **Basic normalization:**
   - Remove `.md` extension
   - Convert to lowercase
   - Replace spaces and underscores with hyphens

   **Without website scoping:**
   - Use only the filename, not the full path
   - Examples:
     - `My Guide.md` -> `my-guide`
     - `API_Reference.md` -> `api-reference`
     - `guides/setup.md` -> `setup`

   **With website scoping** (when domain directories detected):
   - Extract scope from domain: `docs.fastly.com` -> `fastly-docs`, `www.fastly.com` -> `fastly-www`
   - Format: `<scope>:<filename>`
   - Examples:
     - `docs.fastly.com/guides/getting-started.md` -> `fastly-docs:getting-started`
     - `www.fastly.com/products/cdn.md` -> `fastly-www:cdn`
     - `developer.mozilla.org/api/fetch.md` -> `mozilla-developer:fetch`

   **Scope derivation rules:**
   - For `docs.X.com` or `X.docs.com` -> `X-docs`
   - For `www.X.com` -> `X-www`
   - For `developer.X.org` -> `X-developer`
   - For other patterns: take the main domain part and subdomain, e.g., `api.github.com` -> `github-api`

2. **Extract description**:
   - Read the file content
   - Look for the first `# Heading` - use it as description basis
   - If no heading, use the first non-empty paragraph
   - Truncate to ~100 characters
   - If the file has existing YAML frontmatter with a description, prefer that

3. **Handle existing frontmatter**:
   - If the source file has YAML frontmatter (starts with `---`), strip it
   - Replace with skill-compatible frontmatter

4. **Create skill directory** (based on user's destination choice):
   ```txt
   # If Global:
   <global-skills-dir>/<skill-name>/

   # If Local:
   <local-skills-dir>/<skill-name>/
   ```

5. **Write SKILL.md**:
   ```markdown
   ---
   name: <skill-name>
   description: <extracted-description>
   ---

   <original-content-without-old-frontmatter>
   ```

### Step 6: Report Results

After processing all files, report:
- Number of skills created successfully
- Any files that were skipped (with reasons)
- Any errors encountered

Example output (global destination, without scoping):
```txt
Conversion complete:
- Destination: global skills directory
- Created 5 skills
- Skipped 2 files (conflicts with existing skills)

New skills available:
- /my-guide
- /api-reference
- /deployment-guide
- /testing-patterns
- /architecture
```

Example output (local destination, with website scoping):
```txt
Conversion complete:
- Destination: local skills directory (this project)
- Created 8 skills from 2 website sources
- Skipped 1 file (conflict with existing skill)

New skills available:
- /fastly-docs:getting-started
- /fastly-docs:vcl-reference
- /fastly-docs:api-endpoints
- /fastly-docs:caching-guide
- /fastly-www:cdn-overview
- /fastly-www:edge-compute
- /fastly-www:pricing
- /fastly-www:enterprise
```

## Conversion Rules

| Source | Skill Property |
|--------|---------------|
| Filename (e.g., `my-guide.md`) | `name: my-guide` |
| Domain directory + filename | `name: scope:filename` (e.g., `fastly-docs:my-guide`) |
| First `# Heading` or first paragraph | `description` (max ~100 chars) |
| Full file content (minus old frontmatter) | Body of SKILL.md |

## Edge Cases

- **Existing frontmatter**: Strip and replace with skill frontmatter
- **Skill conflicts**: Warn user, skip by default, allow override if confirmed
- **Filename normalization**: `My_Guide File.md` -> `my-guide-file`
- **Subdirectories (no scoping)**: Use only the filename, not the full path
- **Website-scoped directories**: Detect domain-like top-level directories and prefix skill names
- **Duplicate filenames across scopes**: Each scope gets its own skill (e.g., `fastly-docs:api` vs `fastly-www:api`)
- **Empty description**: Default to "Skill converted from <original-filename>"
- **Non-UTF8 files**: Skip with warning
- **Binary files or very large files**: Skip files > 1MB with warning

## Example Transformations

### Example 1: Simple directory (no scoping)

**Source**: `docs/deployment-guide.md`
```markdown
---
author: Jane Doe
date: 2024-01-15
---

# Deploying to Production

This guide covers the steps to deploy our application to production environments.

## Prerequisites

- Docker installed
- Access to container registry
...
```

**Output**: `<skills-dir>/deployment-guide/SKILL.md`
```markdown
---
name: deployment-guide
description: Deploying to Production - This guide covers the steps to deploy our application to production environments.
---

# Deploying to Production

This guide covers the steps to deploy our application to production environments.

## Prerequisites

- Docker installed
- Access to container registry
...
```

### Example 2: Website-scoped directory

**Source directory structure**:
```txt
.skillscache/
├── docs.fastly.com/
│   ├── guides/
│   │   └── getting-started.md
│   └── api/
│       └── endpoints.md
└── www.fastly.com/
    └── products/
        └── cdn.md
```

**Source**: `.skillscache/docs.fastly.com/guides/getting-started.md`
```markdown
# Getting Started with Fastly

Learn how to set up your first Fastly service and start delivering content at the edge.

## Create an Account
...
```

**Output**: `<skills-dir>/fastly-docs:getting-started/SKILL.md`
```markdown
---
name: fastly-docs:getting-started
description: Getting Started with Fastly - Learn how to set up your first Fastly service and start delivering content at the edge.
---

# Getting Started with Fastly

Learn how to set up your first Fastly service and start delivering content at the edge.

## Create an Account
...
```

This skill is invoked with `/fastly-docs:getting-started`.
