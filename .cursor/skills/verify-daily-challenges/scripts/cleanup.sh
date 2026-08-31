#!/usr/bin/env bash
# Tear down processes this run started. Does not delete evidence or stop Postgres.
set -euo pipefail

# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

if [[ ! -f "$VERIFY_STATE" ]]; then
  echo "nothing to clean (no $VERIFY_STATE)"
  exit 0
fi
load_state

stop_pid() {
  local pid="${1:-}"
  local label="$2"
  if ! pid_alive "$pid"; then
    echo "$label: already stopped"
    return 0
  fi
  kill "$pid" 2>/dev/null || true
  local i
  for i in $(seq 1 20); do
    if ! pid_alive "$pid"; then
      echo "$label: stopped $pid"
      return 0
    fi
    sleep 0.2
  done
  kill -9 "$pid" 2>/dev/null || true
  echo "$label: killed $pid"
}

stop_pid "${CHROME_PID:-}" "chrome"
stop_pid "${NEXT_PID:-}" "next"
stop_pid "${EXECUTOR_PID:-}" "executor"

kill_listeners() {
  local port="$1"
  local label="$2"
  local pids=""
  if command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "${port}/tcp" 2>/dev/null || true)"
  fi
  for pid in $pids; do
    if pid_alive "$pid"; then
      kill "$pid" 2>/dev/null || true
      echo "$label: stopped leftover listener $pid on $port"
    fi
  done
}

kill_listeners "$VERIFY_CDP_PORT" "chrome"
kill_listeners "$VERIFY_APP_PORT" "next"
kill_listeners "$VERIFY_EXECUTOR_PORT" "executor"

if [[ "${STARTED_POSTGRES:-0}" == "1" ]]; then
  echo "postgres was started by launch.sh; leaving the cluster up so other work is not disrupted"
fi

rm -f "$VERIFY_STATE"
echo "removed $VERIFY_STATE"
echo "evidence kept at $VERIFY_EVIDENCE_DIR"
echo "chrome profile left at $VERIFY_CHROME_PROFILE (delete if you want a fresh browser)"
