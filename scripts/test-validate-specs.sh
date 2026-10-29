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
  local expected=${2:-}
  local output

  if output=$(run_validator 2>&1); then
    if [[ -n "$expected" && "$output" != *"$expected"* ]]; then
      printf 'FAIL: %s: expected output %s\n%s\n' "$label" "$expected" "$output" >&2
      return 1
    fi
    printf 'PASS: %s\n' "$label"
  else
    printf 'FAIL: %s\n%s\n' "$label" "$output" >&2
    return 1
  fi
}

expect_failure() {
  local label=$1
  local expected=$2
  local output

  if output=$(run_validator 2>&1); then
    printf 'FAIL: %s: expected validation to fail\n%s\n' "$label" "$output" >&2
    return 1
  fi
  if [[ "$output" != *"$expected"* ]]; then
    printf 'FAIL: %s: validator failed for an unexpected reason\n%s\n' "$label" "$output" >&2
    return 1
  fi
  printf 'PASS: %s\n' "$label"
}

reset_fixture() {
  rm -rf "$FIXTURE/projects" "$FIXTURE/docs"
}

write_feature() {
  mkdir -p "$FIXTURE/docs/specs"
  cat >"$FIXTURE/docs/specs/current.feature"
}

write_living_spec() {
  write_feature <<'LIVING_SPEC'
Feature: Current contract
  Scenario: Check the contract
    Given the contract exists
    When the validator runs
    Then the contract passes validation
LIVING_SPEC
}

# Backticks are literal Markdown, not shell command substitutions.
# shellcheck disable=SC2016
write_spec 'The implementation will create `docs/specs/future.feature` when it ships.'
expect_pass 'a planned future feature path is not treated as a broken link'

reset_fixture
write_living_spec
write_spec '- [Current contract](../../docs/specs/current.feature)'
expect_pass 'a linked raw living feature is checked' \
  'docs/specs/current.feature passed structural checks'

reset_fixture
write_spec '- [Missing contract](../../docs/specs/missing.feature)'
expect_failure 'a broken living-feature link fails' \
  'referenced living spec does not exist'

reset_fixture
write_living_spec
expect_pass 'a living feature is checked without a project spec' \
  'docs/specs/current.feature passed structural checks'

write_feature <<'FEATURE'
Scenario: No feature declaration
  When the validator runs
  Then the contract is checked
FEATURE
expect_failure 'a raw living spec requires one Feature' 'must contain exactly one Feature'

write_feature <<'FEATURE'
Feature: No scenarios
FEATURE
expect_failure 'a raw living spec requires a scenario' 'missing a Scenario'

write_feature <<'FEATURE'
Feature: No outcome
  Scenario: Missing assertion
    When the validator runs
FEATURE
expect_failure 'a raw living spec requires an outcome' 'missing a Then step'

write_feature <<'FEATURE'
Feature: First capability
  Scenario: First contract
    When the validator runs
    Then the first contract is checked
Feature: Second capability
  Scenario: Second contract
    When the validator runs
    Then the second contract is checked
FEATURE
expect_failure 'separate capabilities require separate feature files' \
  'must contain exactly one Feature'

write_feature <<'FEATURE'
```gherkin
Feature: Wrapped in Markdown
  Scenario: Check the contract
    Given the contract exists
    When the validator runs
    Then the contract passes validation
```
FEATURE
expect_failure 'living feature files contain raw Gherkin, not fenced Markdown' \
  'use raw Gherkin without Markdown fences'

write_feature <<'FEATURE'
Feature: No setup required
  Scenario: An action has an outcome
    When the validator runs
    Then the contract is checked
FEATURE
expect_pass 'a living feature need not invent a Given step'

write_feature <<'FEATURE'
Feature: Existing state
  Scenario: An invariant holds
    Given the contract exists
    Then it is discoverable
FEATURE
expect_pass 'a living feature need not invent a When step'

write_feature <<'FEATURE'
@contracts
Feature: Contract discovery
  Readers can find the contract for each supported surface.

  Rule: Supported surfaces expose their contract
    Background:
      Given the contracts exist

    Scenario Outline: Find a contract
      When a reader asks for the <surface> contract
      Then its contract is returned

      Examples:
        | surface |
        | API     |
        | CLI     |
FEATURE
expect_pass 'tags, descriptions, Rules, Background, and outlines are accepted'

write_feature <<'FEATURE'
Feature: An example is a scenario
  Example: Check the contract
    When the validator runs
    Then the contract is checked
FEATURE
expect_pass 'the Example scenario alias is accepted'

write_feature <<'FEATURE'
Feature: A template is an outline
  Scenario Template: Check each surface
    When the validator checks <surface>
    Then its contract is returned

    Examples:
      | surface |
      | API     |
FEATURE
expect_pass 'the Scenario Template alias is accepted'

write_feature <<'FEATURE'
# language: en
@documentation
Feature: Document a feature
  Scenario: Show a Gherkin example
    When a reader asks for an example
    Then the documentation contains
      """gherkin
      Feature: Example content, not a second feature
        Scenario: Example content, not a second scenario
      """
FEATURE
expect_pass 'comments and keywords in quoted Doc Strings are not declarations'

write_feature <<'FEATURE'
Feature: Document a feature
  Scenario: Show a Gherkin example
    When a reader asks for an example
    Then the documentation contains
      ```gherkin
      Feature: Example content, not a second feature
      ```
FEATURE
expect_pass 'backtick Doc Strings are data, not Markdown wrappers'

reset_fixture
mkdir -p "$FIXTURE/docs/specs"
printf '# Legacy contract\n' >"$FIXTURE/docs/specs/current.md"
expect_failure 'legacy Markdown living specs require migration' \
  'living specs must use .feature'

reset_fixture
mkdir -p "$FIXTURE/docs/specs"
printf '# Living contract index\n' >"$FIXTURE/docs/specs/README.md"
printf '# Legacy template\n' >"$FIXTURE/docs/specs/TEMPLATE.md"
expect_pass 'Markdown indexes and templates are not living contracts'

reset_fixture
write_spec 'No durable behaviour changes.'
expect_pass 'project acceptance criteria remain fenced Gherkin in Markdown'

grep -v '^[[:space:]]*Given ' "$SPEC" >"$SPEC.tmp"
mv "$SPEC.tmp" "$SPEC"
expect_pass 'project scenarios need not invent a Given step either'

write_spec 'No durable behaviour changes.'
grep -v '^[[:space:]]*When ' "$SPEC" >"$SPEC.tmp"
mv "$SPEC.tmp" "$SPEC"
expect_pass 'project scenarios need not invent a When step either'
