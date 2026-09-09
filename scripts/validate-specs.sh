#!/usr/bin/env bash
# Validate active projects and living specs structure without external dependencies.
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

# Scan active projects (excluding completed, templates, and non-directories)
shopt -s nullglob
PROJECT_DIRS=(projects/*)

for dir in "${PROJECT_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  [[ "$dir" =~ projects/completed ]] && continue

  echo "Checking $dir..."

  # Validate spec.md if present
  spec="$dir/spec.md"
  if [[ -f "$spec" ]]; then
    CHECKED=$((CHECKED + 1))
    file_errors=0
    grep -q "^# " "$spec" || { error "$spec: missing document title (# )"; file_errors=$((file_errors + 1)); }
    grep -q "^## Problem Statement" "$spec" || { error "$spec: missing '## Problem Statement'"; file_errors=$((file_errors + 1)); }
    grep -q "^## Solution" "$spec" || { error "$spec: missing '## Solution'"; file_errors=$((file_errors + 1)); }
    grep -q "^## Acceptance Criteria" "$spec" || { error "$spec: missing '## Acceptance Criteria'"; file_errors=$((file_errors + 1)); }
    grep -q "^[[:space:]]*\`\`\`gherkin" "$spec" || { error "$spec: missing fenced gherkin block"; file_errors=$((file_errors + 1)); }
    grep -qi "docs/specs/" "$spec" || { error "$spec: missing reference to living spec (docs/specs/)"; file_errors=$((file_errors + 1)); }
    if (( file_errors == 0 )); then
      pass "$spec passed structural checks"
    fi
  fi

  # Validate plan.md if present
  plan="$dir/plan.md"
  if [[ -f "$plan" ]]; then
    CHECKED=$((CHECKED + 1))
    file_errors=0
    grep -q "^# " "$plan" || { error "$plan: missing document title (# )"; file_errors=$((file_errors + 1)); }
    grep -q "^## Implementation" "$plan" || { error "$plan: missing '## Implementation'"; file_errors=$((file_errors + 1)); }
    if ! grep -q "^### Documentation" "$plan" && ! grep -qi "^### Slice.*[Dd]ocumentation" "$plan"; then
      error "$plan: missing '### Documentation' section or documentation slice"
      file_errors=$((file_errors + 1))
    fi
    if (( file_errors == 0 )); then
      pass "$plan passed structural checks"
    fi
  fi
done

# Validate living specs in docs/specs/ if the directory exists
if [[ -d "docs/specs" ]]; then
  SPECS=(docs/specs/*.md)
  for s in "${SPECS[@]}"; do
    [[ -f "$s" ]] || continue
    [[ "$(basename "$s")" == "TEMPLATE.md" ]] && continue
    CHECKED=$((CHECKED + 1))
    file_errors=0
    grep -q "^# " "$s" || { error "$s: missing document title (# )"; file_errors=$((file_errors + 1)); }
    if (( file_errors == 0 )); then
      pass "$s passed structural checks"
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
