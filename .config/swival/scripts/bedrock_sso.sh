#!/bin/sh

# Ensure AWS SSO session is active for the bedrock profile.
# Usage: bedrock-sso startup|exit <base_dir>
#
# On startup, tries (in order):
#   1. Existing credentials (get-caller-identity succeeds).
#   2. Token refresh via the sso-session refresh token.
#   3. OIDC login (browser or device mode).
#
# Environment:
#   PROFILE                  AWS CLI profile name (default: "bedrock").
#   AWS_BEDROCK_SSO_SESSION  AWS SSO session name (default: read from AWS profile).
#   AUTH_MODE                OIDC auth mode (default: "browser").
#                    "browser" opens OIDC login in the browser.
#                    "device" prints a URL and code for out-of-band auth.

set -e

readonly AUTH_MODE="${AUTH_MODE:-browser}"
readonly PROFILE="${PROFILE:-bedrock}"

log_msg() {
  if ( exec >/dev/tty ) 2>/dev/null; then
    printf '%s\n' "$*" > /dev/tty
  fi
  printf '%s\n' "$*" >&2
}

DETECTED_SESSION="${AWS_BEDROCK_SSO_SESSION:-$(aws configure get sso_session --profile "$PROFILE" 2>/dev/null || true)}"
if [ -z "$DETECTED_SESSION" ]; then
  log_msg "$0: AWS_BEDROCK_SSO_SESSION is not set and could not be determined from AWS profile '$PROFILE'"
  exit 1
fi
readonly AWS_BEDROCK_SSO_SESSION="$DETECTED_SESSION"

ACTION="${1:-}"
BASE_DIR="${2:-}"

if [ -z "$ACTION" ] || [ -z "$BASE_DIR" ]; then
  log_msg "Usage: $0 startup|exit <base_dir>"
  exit 1
fi

case "$AUTH_MODE" in
browser|device) ;;
*)
  log_msg "$0: unknown AUTH_MODE: $AUTH_MODE (expected browser or device)"
  exit 1
  ;;
esac

sso_ok() {
  timeout 5 aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1
}

case "$ACTION" in
exit)
  ;;
startup)
  # Existing credentials are still valid.
  if sso_ok; then
    log_msg "$0: bedrock SSO session active"
  # Refresh the OIDC token using the cached refresh token.
  elif aws sso login --sso-session "$AWS_BEDROCK_SSO_SESSION" >/dev/null 2>&1 && sso_ok; then
    log_msg "$0: bedrock SSO session refreshed"
  # Refresh token expired; fall back to full OIDC login.
  else
    log_msg "$0: logging in to bedrock SSO ($AUTH_MODE mode)..."
    if [ "$AUTH_MODE" = "device" ]; then
      LOGIN_CMD="aws sso login --profile=$PROFILE --no-browser"
    else
      LOGIN_CMD="aws sso login --profile=$PROFILE"
    fi

    if ( exec >/dev/tty ) 2>/dev/null; then
      $LOGIN_CMD > /dev/tty 2>&1 || {
        log_msg "$0: aws sso login failed"
        exit 1
      }
    else
      $LOGIN_CMD || {
        log_msg "$0: aws sso login failed"
        exit 1
      }
    fi
  fi
  ;;
*)
  log_msg "$0: unknown action: $ACTION"
  exit 1
  ;;
esac
