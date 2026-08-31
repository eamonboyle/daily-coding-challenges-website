# Shared paths and defaults for verify-daily-challenges helpers.
# shellcheck shell=bash

VERIFY_DIR="${VERIFY_DIR:-/tmp/verify-daily-challenges}"
VERIFY_RUN_DIR="${VERIFY_RUN_DIR:-$VERIFY_DIR/run}"
VERIFY_EVIDENCE_DIR="${VERIFY_EVIDENCE_DIR:-$VERIFY_DIR/evidence}"
VERIFY_TOOLING="${VERIFY_TOOLING:-$VERIFY_DIR/tooling}"
VERIFY_CHROME_PROFILE="${VERIFY_CHROME_PROFILE:-$VERIFY_DIR/chrome-profile}"
VERIFY_STATE="${VERIFY_STATE:-$VERIFY_RUN_DIR/state.env}"

VERIFY_APP_PORT="${VERIFY_APP_PORT:-3010}"
VERIFY_EXECUTOR_PORT="${VERIFY_EXECUTOR_PORT:-5010}"
VERIFY_CDP_PORT="${VERIFY_CDP_PORT:-9322}"
VERIFY_APP_HOST="${VERIFY_APP_HOST:-127.0.0.1}"

VERIFY_APP_URL="${VERIFY_APP_URL:-http://${VERIFY_APP_HOST}:${VERIFY_APP_PORT}}"
VERIFY_EXECUTOR_URL="${VERIFY_EXECUTOR_URL:-http://${VERIFY_APP_HOST}:${VERIFY_EXECUTOR_PORT}}"
VERIFY_CDP_URL="${VERIFY_CDP_URL:-http://${VERIFY_APP_HOST}:${VERIFY_CDP_PORT}}"

VERIFY_PG_USER="${VERIFY_PG_USER:-daily_coding_challenge}"
VERIFY_PG_PASSWORD="${VERIFY_PG_PASSWORD:-daily_coding_challenge}"
VERIFY_PG_HOST="${VERIFY_PG_HOST:-127.0.0.1}"
VERIFY_PG_PORT="${VERIFY_PG_PORT:-5432}"
VERIFY_PG_DATABASE="${VERIFY_PG_DATABASE:-daily_coding_challenge_verify}"
VERIFY_DATABASE_URL="${VERIFY_DATABASE_URL:-postgresql://${VERIFY_PG_USER}:${VERIFY_PG_PASSWORD}@${VERIFY_PG_HOST}:${VERIFY_PG_PORT}/${VERIFY_PG_DATABASE}}"

VERIFY_CLERK_USER_ID="${VERIFY_CLERK_USER_ID:-mock_clerk_user}"
VERIFY_HEADLESS="${VERIFY_HEADLESS:-1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"

mkdir -p "$VERIFY_RUN_DIR" "$VERIFY_EVIDENCE_DIR"

load_state() {
  if [[ -f "$VERIFY_STATE" ]]; then
    # shellcheck disable=SC1090
    source "$VERIFY_STATE"
  fi
}

write_state() {
  cat >"$VERIFY_STATE" <<EOF
VERIFY_APP_URL=$VERIFY_APP_URL
VERIFY_EXECUTOR_URL=$VERIFY_EXECUTOR_URL
VERIFY_CDP_URL=$VERIFY_CDP_URL
VERIFY_DATABASE_URL=$VERIFY_DATABASE_URL
VERIFY_EVIDENCE_DIR=$VERIFY_EVIDENCE_DIR
VERIFY_TOOLING=$VERIFY_TOOLING
VERIFY_CHROME_PROFILE=$VERIFY_CHROME_PROFILE
VERIFY_HEADLESS=$VERIFY_HEADLESS
VERIFY_CLERK_USER_ID=$VERIFY_CLERK_USER_ID
VERIFY_REPO_ROOT=$REPO_ROOT
EXECUTOR_PID=${EXECUTOR_PID:-}
NEXT_PID=${NEXT_PID:-}
CHROME_PID=${CHROME_PID:-}
STARTED_POSTGRES=${STARTED_POSTGRES:-0}
EOF
}

pid_alive() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

port_open() {
  local host="$1"
  local port="$2"
  python3 - "$host" "$port" <<'PY'
import socket, sys
host, port = sys.argv[1], int(sys.argv[2])
s = socket.socket()
s.settimeout(0.4)
try:
    s.connect((host, port))
except OSError:
    sys.exit(1)
finally:
    s.close()
PY
}

wait_port() {
  local host="$1"
  local port="$2"
  local label="$3"
  local tries="${4:-90}"
  local i
  for i in $(seq 1 "$tries"); do
    if port_open "$host" "$port"; then
      return 0
    fi
    sleep 1
  done
  echo "timeout waiting for $label on ${host}:${port}" >&2
  return 1
}

http_body() {
  local url="$1"
  curl -fsS --max-time 5 "$url" 2>/dev/null || true
}

detect_chrome() {
  if [[ -n "${VERIFY_CHROME:-}" && -x "$VERIFY_CHROME" ]]; then
    echo "$VERIFY_CHROME"
    return 0
  fi
  local candidate
  for candidate in \
    /usr/bin/google-chrome \
    /usr/bin/google-chrome-stable \
    /usr/bin/chromium \
    /usr/bin/chromium-browser \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  if command -v google-chrome >/dev/null 2>&1; then
    command -v google-chrome
    return 0
  fi
  echo "no Chrome/Chromium binary found" >&2
  return 1
}
