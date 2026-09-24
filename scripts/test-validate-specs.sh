#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="$ROOT/scripts/validate-specs.sh"
FIXTURE="$(mktemp -d)"
SPEC="$FIXTURE/projects/2026-01-01-example/spec.md"

trap 'rm -rf "$FIXTURE"' EXIT

write_spec() {
  local living_reference=$1

  mkdir -p "$(dirname "$SPEC")"
  cat >"$SPEC" <<'SPEC_HEADER'
# Example — Specification

## Problem Statement

A behavior needs a contract.

## Solution

Document the behavior.

## Acceptance Criteria

## Living Specifications
SPEC_HEADER
  printf '%s\n' "$living_reference" >>"$SPEC"
  cat >>"$SPEC" <<'SPEC_GHERKIN'

```gherkin
Feature: Example behavior
  Scenario: Validate a spec
    Given a project spec
    When the validator runs
    Then it checks the document
```
SPEC_GHERKIN
}

run_validator() {
  (cd "$FIXTURE" && bash "$VALIDATOR")
}

expect_pass() {
  local label=$1
  local output

  if output=$(run_validator 2>&1); then
    printf 'PASS: %s\n' "$label"
  else
    printf 'FAIL: %s\n%s\n' "$label" "$output" >&2
    return 1
  fi
}

expect_broken_link_failure() {
  local label=$1
  local output

  if output=$(run_validator 2>&1); then
    printf 'FAIL: %s: expected a missing linked spec to fail\n' "$label" >&2
    return 1
  fi
  if [[ "$output" != *"referenced living spec does not exist"* ]]; then
    printf 'FAIL: %s: validator failed for an unexpected reason\n%s\n' "$label" "$output" >&2
    return 1
  fi
  printf 'PASS: %s\n' "$label"
}

write_living_spec() {
  cat >"$FIXTURE/docs/specs/current.md" <<'LIVING_SPEC'
# Current contract

## Behaviour

The capability has a current contract.

```gherkin
Feature: Current contract
  Scenario: Check the contract
    Given the contract exists
    When the validator runs
    Then the contract passes validation
```
LIVING_SPEC
}

write_spec 'The implementation will create `docs/specs/future.md` when it ships.'
expect_pass 'a planned future spec path is not treated as a broken link'

rm -rf "$FIXTURE/projects" "$FIXTURE/docs"
mkdir -p "$FIXTURE/docs/specs"
write_living_spec
write_spec '- [Current contract](../../docs/specs/current.md)'
expect_pass 'an existing linked living spec passes'

rm -rf "$FIXTURE/projects" "$FIXTURE/docs"
write_spec '- [Missing contract](../../docs/specs/missing.md)'
expect_broken_link_failure 'a broken living-spec link fails'
