---
name: code-research
description: >-
  Triggers when user mentions a repo by name or GitHub URL — e.g.
  "check the spotless repo", "look at the
  github.com/fastly/spotless repo". Locates the repo locally under
  ~/code or clones it with gh.
user-invocable: true
argument-hint: <repo-name | github-url>
---

# Code Research

Look at, explore, or research a repository by name or GitHub URL.

## When to use

- User asks to look at, explore, or research a repo.
- Input is a GitHub URL (`https://github.com/{org}/{repo}`) or a
  bare repo name (optionally with org prefix like `org/repo`).

## Parse input

Extract `{org}` and `{repo}` from the argument:

1. **GitHub URL** — strip `https://github.com/` prefix, split on `/`
   to get `{org}` and `{repo}`. Remove any trailing `.git`.
1. **`org/repo` form** — split on `/`.
1. **Bare repo name** — no `/` present; `{org}` is unknown.

## Locate locally

1. If `{org}` is known, check whether `~/code/{org}/{repo}` exists.
1. If only a bare name, search `~/code/*/{repo}` for a matching
   directory.
   - If exactly one match is found, use it.
   - If multiple matches are found, list them and ask the user which
     one to use.
   - If no match is found, ask the user for the org (or full URL) so
     you can clone it.

## Clone if missing

If the repo is not found locally and `{org}` is known:

```bash
gh repo clone {org}/{repo} ~/code/{org}/{repo}
```

## When in doubt, ask

Do not guess. If any of the following are unclear, stop and ask the
user before proceeding:

- The input is ambiguous (e.g. a bare name that could match multiple
  orgs, or a name that doesn't match any known repo).
- You aren't sure what the user wants to know about the repo.
- The clone would go to an unexpected location.
- The repo doesn't exist on GitHub (clone fails).

Prefer a short clarifying question over a wrong assumption.

## Research

Once the repo is local, use Explore agents and read tools to answer
the user's question about it. Set the exploration path to the repo
root (`~/code/{org}/{repo}`).
