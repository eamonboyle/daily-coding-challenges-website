#!/usr/bin/env bash
# Read-only health check. Exit 0 only when this run's mock stack is safe to drive.
set -euo pipefail

# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

FAIL=0
note() { printf '%s\n' "$*"; }
fail() { printf 'FAIL %s\n' "$*" >&2; FAIL=1; }

if [[ ! -f "$VERIFY_STATE" ]]; then
  fail "no state file at $VERIFY_STATE (run scripts/launch.sh)"
  exit 1
fi
load_state

if ! port_open "$VERIFY_PG_HOST" "$VERIFY_PG_PORT"; then
  fail "postgres not listening on ${VERIFY_PG_HOST}:${VERIFY_PG_PORT}"
else
  export PGPASSWORD="$VERIFY_PG_PASSWORD"
  if ! psql -h "$VERIFY_PG_HOST" -p "$VERIFY_PG_PORT" -U "$VERIFY_PG_USER" -d "$VERIFY_PG_DATABASE" -tAc "SELECT 1" >/dev/null; then
    fail "cannot query database $VERIFY_PG_DATABASE"
  else
    note "postgres: ok $VERIFY_PG_DATABASE"
  fi
fi

if ! pid_alive "${EXECUTOR_PID:-}"; then
  fail "executor pid ${EXECUTOR_PID:-unset} is not running"
elif ! port_open "$VERIFY_APP_HOST" "$VERIFY_EXECUTOR_PORT"; then
  fail "executor port $VERIFY_EXECUTOR_PORT is not open"
else
  BODY="$(http_body "$VERIFY_EXECUTOR_URL/health")"
  if [[ "$BODY" != *'"ok":true'* || "$BODY" != *'"mode":"mock"'* ]]; then
    fail "executor /health expected mock ok, got: ${BODY:-empty}"
  else
    note "executor: ok $VERIFY_EXECUTOR_URL/health $BODY"
  fi
fi

if ! pid_alive "${NEXT_PID:-}"; then
  fail "next pid ${NEXT_PID:-unset} is not running"
elif ! port_open "$VERIFY_APP_HOST" "$VERIFY_APP_PORT"; then
  fail "app port $VERIFY_APP_PORT is not open"
else
  HOME_BODY="$(http_body "$VERIFY_APP_URL/")"
  if [[ "$HOME_BODY" != *"Daily Code Challenge"* ]]; then
    fail "GET $VERIFY_APP_URL/ did not contain Daily Code Challenge"
  elif [[ "$HOME_BODY" != *"Mock"* ]]; then
    fail "GET $VERIFY_APP_URL/ is missing the Mock badge. This stack is not in client mock mode."
  else
    note "app: ok $VERIFY_APP_URL (Daily Code Challenge, Mock)"
  fi
fi

if ! pid_alive "${CHROME_PID:-}"; then
  fail "chrome pid ${CHROME_PID:-unset} is not running"
else
  VER="$(http_body "$VERIFY_CDP_URL/json/version")"
  if [[ "$VER" != *"webSocketDebuggerUrl"* ]]; then
    fail "chrome CDP at $VERIFY_CDP_URL is not answering"
  else
    note "chrome: ok $VERIFY_CDP_URL"
  fi
fi

if [[ ! -d "$VERIFY_TOOLING/node_modules/playwright-core" ]]; then
  fail "playwright-core missing under $VERIFY_TOOLING (re-run launch.sh)"
else
  note "tooling: ok playwright-core"
fi

if [[ "$FAIL" -ne 0 ]]; then
  note "logs: $VERIFY_RUN_DIR/next.log $VERIFY_RUN_DIR/executor.log $VERIFY_RUN_DIR/chrome.log"
  exit 1
fi

note "owned pids: next=${NEXT_PID} executor=${EXECUTOR_PID} chrome=${CHROME_PID}"
note "evidence: $VERIFY_EVIDENCE_DIR"
exit 0
