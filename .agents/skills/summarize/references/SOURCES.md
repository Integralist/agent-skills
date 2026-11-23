# Summary Source Gathering and File Output

Read this reference only when summarising a URL, branch diff, GitHub issue
(`--github`, `#<n>`, or URL), or truncated file, or when asked to save a
summary to disk.

## Reading sources

- **File:** Read the whole file, continuing through truncated output. If you
  stop early, state what was read.
- **URL:** Fetch and read the actual page content; never summarise from a
  search snippet or guess. If the fetch fails or only partial text is
  readable, stop and report the gap.
- **GitHub issue (`--github`, `#<n>`, or URL):** Read and follow
  [GITHUB-ISSUES.md](../../shared/GITHUB-ISSUES.md) in read-only mode (do not
  create labels or mutate issues). Inspect the issue body, sub-issues, and
  relevant Root Issue Artifacts; flag unread artifacts or sub-issues as
  partial coverage.
- **Branch diff / unpushed work:** Base on `origin/main` or `origin/master`
  (never local `main`). Read the full relevant diff and enough surrounding
  code to understand behaviour (`--stat` alone cannot establish behaviour).
  Proposed plans describe intent, not delivered work.

## Saving to disk

Chat output is the default. Write to a file only when asked, saving to
`$TMPDIR/summary-<branch>-<format>.md` unless the user gives a path.
