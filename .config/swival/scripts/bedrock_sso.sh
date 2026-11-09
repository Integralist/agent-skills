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
#   PROFILE      AWS CLI profile name (default: "bedrock").
#   AWS_BEDROCK_SSO_SESSION  AWS SSO session name (required, no default).
#   AUTH_MODE    OIDC auth mode (default: "browser").
#                    "browser" opens OIDC login in the browser.
#                    "device" prints a URL and code for out-of-band auth.

set -e
set -x

readonly AUTH_MODE="${AUTH_MODE:-browser}"
readonly PROFILE="${PROFILE:-bedrock}"
readonly AWS_BEDROCK_SSO_SESSION="${AWS_BEDROCK_SSO_SESSION:?set AWS_BEDROCK_SSO_SESSION to your AWS SSO session name}"

ACTION="${1:-}"
BASE_DIR="${2:-}"

if [ -z "$ACTION" ] || [ -z "$BASE_DIR" ]; then
  echo "Usage: $0 startup|exit <base_dir>" >&2
  exit 1
fi

case "$AUTH_MODE" in
browser|device) ;;
*)
  echo "$0: unknown AUTH_MODE: $AUTH_MODE (expected browser or device)" >&2
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
     echo "$0: bedrock SSO session active" >&2
     # Refresh the OIDC token using the cached refresh token.
   elif aws sso login --sso-session "$AWS_BEDROCK_SSO_SESSION" >/dev/null 2>&1 && sso_ok; then
     echo "$0: bedrock SSO session refreshed" >&2
     # Refresh token expired; fall back to full OIDC login.
  else
     echo "$0: logging in to bedrock SSO ($AUTH_MODE mode)..." >&2
     if [ "$AUTH_MODE" = "device" ]; then
       aws sso login --profile="$PROFILE" --no-browser
     else
       aws sso login --profile="$PROFILE"
     fi
  fi
  ;;
*)
  echo "$0: unknown action: $ACTION" >&2
  exit 1
  ;;
esac
