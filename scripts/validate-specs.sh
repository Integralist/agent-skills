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
  local raw=0
  local raw_header=0
  local doc_string=""
  local file_errors=0
  local features=0
  local scenarios=0
  local thens=0
  local line
  local trimmed

  if [[ "$file" == *.feature ]]; then
    raw=1
    in_block=1
  fi

  # These are structural checks, not a substitute for the runner's parser.
  while IFS= read -r line || [[ -n "$line" ]]; do
    if (( ! raw )); then
      if (( ! in_block )) && [[ "$line" == *'```gherkin'* ]]; then
        in_block=1
        continue
      fi
      if (( in_block )) && [[ "$line" == '```'* ]]; then
        in_block=0
        continue
      fi
    elif (( ! raw_header )) && [[ ! "$line" =~ ^[[:space:]]*($|#|@) ]]; then
      raw_header=1
      if [[ ! "$line" =~ ^[[:space:]]*Feature: ]]; then
        error "$file: use raw Gherkin without Markdown fences or headings"
        file_errors=$((file_errors + 1))
      fi
    fi
    (( in_block )) || continue

    # Keywords inside Doc Strings are data, not feature declarations or steps.
    trimmed=${line#"${line%%[![:space:]]*}"}
    if [[ -n "$doc_string" ]]; then
      [[ "$trimmed" == "$doc_string"* ]] && doc_string=""
      continue
    fi
    if [[ "$trimmed" == '"""'* || "$trimmed" == '```'* ]]; then
      doc_string=${trimmed:0:3}
      continue
    fi

    [[ "$line" =~ ^[[:space:]]*Feature: ]] && features=$((features + 1))
    [[ "$line" =~ ^[[:space:]]*(Scenario([[:space:]](Outline|Template))?|Example): ]] && scenarios=$((scenarios + 1))
    [[ "$line" =~ ^[[:space:]]*Then[[:space:]] ]] && thens=$((thens + 1))
  done <"$file"

  if (( raw )); then
    (( features == 1 )) || { error "$file: living spec must contain exactly one Feature"; file_errors=$((file_errors + 1)); }
  else
    (( features > 0 )) || { error "$file: gherkin block is missing a Feature"; file_errors=$((file_errors + 1)); }
  fi
  (( scenarios > 0 )) || { error "$file: Gherkin is missing a Scenario"; file_errors=$((file_errors + 1)); }
  (( thens > 0 )) || { error "$file: Gherkin is missing a Then step"; file_errors=$((file_errors + 1)); }

  return "$file_errors"
}

validate_doc_references() {
  local file=$1
  local reference
  local file_errors=0

  # Check concrete Markdown links only. Inline-code paths may describe a
  # living spec that the implementation will create later.
  while IFS= read -r reference; do
    [[ -n "$reference" ]] || continue
    if [[ ! -f "$reference" ]]; then
      error "$file: referenced living spec does not exist: $reference"
      file_errors=$((file_errors + 1))
    fi
  done < <(
    grep -oE '\]\([^)]*docs/specs/[A-Za-z0-9._/-]+' "$file" \
      | grep -oE 'docs/specs/[A-Za-z0-9._/-]+' || true
  )

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
  SPECS=(docs/specs/*.feature docs/specs/*.md)
  for spec in "${SPECS[@]}"; do
    [[ -f "$spec" ]] || continue
    case "$(basename "$spec")" in
      README.md | TEMPLATE.md) continue ;;
    esac
    CHECKED=$((CHECKED + 1))
    if [[ "$spec" == *.md ]]; then
      error "$spec: living specs must use .feature; migrate this Markdown contract"
      continue
    fi
    if validate_gherkin "$spec"; then
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
