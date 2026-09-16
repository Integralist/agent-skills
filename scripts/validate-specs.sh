#!/usr/bin/env bash
# Validate active projects and living specs without external dependencies.
set -euo pipefail

ERRORS=0
CHECKED=0

error() {
  echo "❌ $1" >&2
  ERRORS=$((ERRORS + 1))
}

pass() {
  echo "✅ $1"
}

validate_gherkin() {
  local file=$1
  local in_block=0
  local features=0
  local scenarios=0
  local givens=0
  local whens=0
  local thens=0
  local line

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == *'```gherkin'* ]]; then
      in_block=1
      continue
    fi
    if (( in_block )) && [[ "$line" == '```'* ]]; then
      in_block=0
      continue
    fi
    (( in_block )) || continue

    [[ "$line" =~ ^[[:space:]]*Feature: ]] && features=$((features + 1))
    [[ "$line" =~ ^[[:space:]]*Scenario([[:space:]]Outline)?: ]] && scenarios=$((scenarios + 1))
    [[ "$line" =~ ^[[:space:]]*Given[[:space:]] ]] && givens=$((givens + 1))
    [[ "$line" =~ ^[[:space:]]*When[[:space:]] ]] && whens=$((whens + 1))
    [[ "$line" =~ ^[[:space:]]*Then[[:space:]] ]] && thens=$((thens + 1))
  done <"$file"

  local file_errors=0
  (( features > 0 )) || { error "$file: gherkin block is missing a Feature"; file_errors=$((file_errors + 1)); }
  (( scenarios > 0 )) || { error "$file: gherkin block is missing a Scenario"; file_errors=$((file_errors + 1)); }
  (( givens > 0 )) || { error "$file: gherkin block is missing a Given step"; file_errors=$((file_errors + 1)); }
  (( whens > 0 )) || { error "$file: gherkin block is missing a When step"; file_errors=$((file_errors + 1)); }
  (( thens > 0 )) || { error "$file: gherkin block is missing a Then step"; file_errors=$((file_errors + 1)); }

  return "$file_errors"
}

validate_doc_references() {
  local file=$1
  local reference
  local file_errors=0

  while IFS= read -r reference; do
    [[ -n "$reference" ]] || continue
    if [[ ! -f "$reference" ]]; then
      error "$file: referenced living spec does not exist: $reference"
      file_errors=$((file_errors + 1))
    fi
  done < <(grep -oE 'docs/specs/[A-Za-z0-9._/-]+' "$file" || true)

  return "$file_errors"
}

validate_project_document() {
  local file=$1
  local file_errors=0

  grep -q '^# ' "$file" || { error "$file: missing document title (# )"; file_errors=$((file_errors + 1)); }

  if [[ "$(basename "$file")" == "spec.md" ]]; then
    grep -q '^## Problem Statement' "$file" || { error "$file: missing '## Problem Statement'"; file_errors=$((file_errors + 1)); }
    grep -q '^## Solution' "$file" || { error "$file: missing '## Solution'"; file_errors=$((file_errors + 1)); }
    grep -q '^## Acceptance Criteria' "$file" || { error "$file: missing '## Acceptance Criteria'"; file_errors=$((file_errors + 1)); }
    grep -q '^## Living Specifications' "$file" || { error "$file: missing '## Living Specifications'"; file_errors=$((file_errors + 1)); }
    if ! validate_gherkin "$file"; then file_errors=$((file_errors + 1)); fi
    if ! validate_doc_references "$file"; then file_errors=$((file_errors + 1)); fi
  elif [[ "$(basename "$file")" == "plan.md" ]]; then
    grep -q '^## Implementation' "$file" || { error "$file: missing '## Implementation'"; file_errors=$((file_errors + 1)); }
    if ! grep -q '^### Documentation' "$file" && ! grep -qi '^### Slice.*[Dd]ocumentation' "$file"; then
      error "$file: missing '### Documentation' section or documentation slice"
      file_errors=$((file_errors + 1))
    fi
  elif [[ "$(basename "$file")" == "project.md" ]]; then
    grep -q '^## Preliminary Milestones' "$file" || { error "$file: missing '## Preliminary Milestones'"; file_errors=$((file_errors + 1)); }
    grep -q '^## Key Objectives' "$file" || { error "$file: missing '## Key Objectives'"; file_errors=$((file_errors + 1)); }
    grep -q '^## Functional Requirements' "$file" || { error "$file: missing '## Functional Requirements'"; file_errors=$((file_errors + 1)); }
    grep -q '^## Non-functional Requirements' "$file" || { error "$file: missing '## Non-functional Requirements'"; file_errors=$((file_errors + 1)); }
  fi

  return "$file_errors"
}

# Scan active projects. Completed projects are historical records and are not
# revalidated by the active-workflow check.
shopt -s nullglob
PROJECT_DIRS=(projects/*)

for dir in "${PROJECT_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  [[ "$dir" == projects/completed ]] && continue

  echo "Checking $dir..."
  project_files=0

  for document in "$dir/project.md" "$dir/spec.md" "$dir/plan.md"; do
    [[ -f "$document" ]] || continue
    project_files=$((project_files + 1))
    CHECKED=$((CHECKED + 1))
    if validate_project_document "$document"; then
      pass "$document passed structural checks"
    fi
  done

  while IFS= read -r task; do
    [[ -f "$task" ]] || continue
    project_files=$((project_files + 1))
    CHECKED=$((CHECKED + 1))
    if grep -q '^# ' "$task"; then
      pass "$task passed structural checks"
    else
      error "$task: missing document title (# )"
    fi
  done < <(find "$dir" -maxdepth 1 -type f -name 'tasks*.md' -print)

  if (( project_files == 0 )); then
    error "$dir: no recognized planning documents found"
  fi
done

# Validate living specs in docs/specs/ if the directory exists.
if [[ -d "docs/specs" ]]; then
  SPECS=(docs/specs/*.md)
  for spec in "${SPECS[@]}"; do
    [[ -f "$spec" ]] || continue
    [[ "$(basename "$spec")" == "TEMPLATE.md" ]] && continue
    CHECKED=$((CHECKED + 1))
    file_errors=0
    grep -q '^# ' "$spec" || { error "$spec: missing document title (# )"; file_errors=$((file_errors + 1)); }
    grep -q '^## ' "$spec" || { error "$spec: missing a second-level section (## )"; file_errors=$((file_errors + 1)); }
    if ! validate_gherkin "$spec"; then file_errors=$((file_errors + 1)); fi
    if (( file_errors == 0 )); then
      pass "$spec passed structural checks"
    fi
  done
fi

if (( ERRORS > 0 )); then
  echo ""
  echo "Validation failed with $ERRORS error(s)." >&2
  exit 1
fi

if (( CHECKED == 0 )); then
  echo "No active project specs or docs/specs found to validate."
else
  echo ""
  echo "All $CHECKED document(s) passed validation."
fi
exit 0
