#!/usr/bin/env bash
# Start an isolated mock stack for verification. Idempotent if we already own it.
set -euo pipefail

# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

cd "$REPO_ROOT"

if [[ -f "$VERIFY_STATE" ]]; then
  load_state
  if pid_alive "${NEXT_PID:-}" && pid_alive "${EXECUTOR_PID:-}" && pid_alive "${CHROME_PID:-}"; then
    if "$SCRIPT_DIR/doctor.sh" >/dev/null; then
      echo "reusing healthy stack at $VERIFY_APP_URL"
      exit 0
    fi
  fi
fi

stranger_port() {
  local port="$1"
  local name="$2"
  if port_open "$VERIFY_APP_HOST" "$port"; then
    echo "$name port ${port} is already taken by a process this run did not start." >&2
    echo "Refuse to drive it. Set VERIFY_${name}_PORT to a free port, or stop that process." >&2
    return 0
  fi
  return 1
}

if [[ ! -f "$VERIFY_STATE" ]] || ! pid_alive "${NEXT_PID:-}"; then
  if stranger_port "$VERIFY_APP_PORT" "APP"; then
    exit 1
  fi
fi
if [[ ! -f "$VERIFY_STATE" ]] || ! pid_alive "${EXECUTOR_PID:-}"; then
  if stranger_port "$VERIFY_EXECUTOR_PORT" "EXECUTOR"; then
    exit 1
  fi
fi
if [[ ! -f "$VERIFY_STATE" ]] || ! pid_alive "${CHROME_PID:-}"; then
  if stranger_port "$VERIFY_CDP_PORT" "CDP"; then
    exit 1
  fi
fi

STARTED_POSTGRES=0
if ! port_open "$VERIFY_PG_HOST" "$VERIFY_PG_PORT"; then
  if command -v pg_ctlcluster >/dev/null 2>&1; then
    sudo pg_ctlcluster 16 main start
    STARTED_POSTGRES=1
  elif [[ -f "$REPO_ROOT/docker-compose.postgres.yml" ]] && command -v docker >/dev/null 2>&1; then
    (cd "$REPO_ROOT" && npm run db:up)
    STARTED_POSTGRES=1
  else
    echo "Postgres is not listening on ${VERIFY_PG_HOST}:${VERIFY_PG_PORT} and no starter is available." >&2
    echo "Start it with: sudo pg_ctlcluster 16 main start" >&2
    exit 1
  fi
  wait_port "$VERIFY_PG_HOST" "$VERIFY_PG_PORT" "postgres" 30
fi

export PGPASSWORD="$VERIFY_PG_PASSWORD"
if ! psql -h "$VERIFY_PG_HOST" -p "$VERIFY_PG_PORT" -U "$VERIFY_PG_USER" -d postgres -tAc "SELECT 1" >/dev/null; then
  echo "cannot connect to Postgres as ${VERIFY_PG_USER}" >&2
  exit 1
fi

DB_EXISTS="$(psql -h "$VERIFY_PG_HOST" -p "$VERIFY_PG_PORT" -U "$VERIFY_PG_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${VERIFY_PG_DATABASE}'" || true)"
if [[ "$DB_EXISTS" != "1" ]]; then
  if ! psql -h "$VERIFY_PG_HOST" -p "$VERIFY_PG_PORT" -U "$VERIFY_PG_USER" -d postgres -c "CREATE DATABASE ${VERIFY_PG_DATABASE};" 2>/dev/null; then
    sudo -u postgres createdb -O "$VERIFY_PG_USER" "$VERIFY_PG_DATABASE"
  fi
fi

DATABASE_URL="$VERIFY_DATABASE_URL" npx prisma db push

if [[ ! -d "$VERIFY_TOOLING/node_modules/playwright-core" ]]; then
  mkdir -p "$VERIFY_TOOLING"
  if [[ ! -f "$VERIFY_TOOLING/package.json" ]]; then
    printf '{"name":"verify-daily-challenges-tooling","private":true}\n' >"$VERIFY_TOOLING/package.json"
  fi
  (cd "$VERIFY_TOOLING" && npm install --no-fund --no-audit playwright-core@1.62.1)
fi

if [[ ! -d "$REPO_ROOT/node_modules" ]]; then
  echo "root node_modules missing. Run npm install in $REPO_ROOT first." >&2
  exit 1
fi
if [[ ! -d "$REPO_ROOT/code-execution-server/node_modules" ]]; then
  echo "executor node_modules missing. Run npm install in code-execution-server first." >&2
  exit 1
fi

CHROME_BIN="$(detect_chrome)"

EXECUTOR_PID=""
NEXT_PID=""
CHROME_PID=""

cleanup_failed_launch() {
  kill_tree "${CHROME_PID:-}"
  kill_tree "${NEXT_PID:-}"
  kill_tree "${EXECUTOR_PID:-}"
  kill_port_listeners "$VERIFY_APP_PORT"
  kill_port_listeners "$VERIFY_EXECUTOR_PORT"
  kill_port_listeners "$VERIFY_CDP_PORT"
}
trap cleanup_failed_launch ERR

export APP_MODE=mock
export NEXT_PUBLIC_APP_MODE=mock
export MOCK_OPENAI=true
export EXECUTION_MODE=mock
export DATABASE_URL="$VERIFY_DATABASE_URL"
export CODE_EXECUTION_URL="$VERIFY_EXECUTOR_URL"
export NEXT_PUBLIC_APP_URL="$VERIFY_APP_URL"
export MOCK_CLERK_USER_ID="$VERIFY_CLERK_USER_ID"
export NEXT_PUBLIC_MOCK_CLERK_USER_ID="$VERIFY_CLERK_USER_ID"
export EXECUTION_API_SECRET=""

cd "$REPO_ROOT/code-execution-server"
setsid env EXECUTION_MODE=mock PORT="$VERIFY_EXECUTOR_PORT" npx ts-node src/index.ts \
  </dev/null >"$VERIFY_RUN_DIR/executor.log" 2>&1 &
EXECUTOR_PID=$!

cd "$REPO_ROOT"
setsid env PORT="$VERIFY_APP_PORT" npx next dev -H "$VERIFY_APP_HOST" -p "$VERIFY_APP_PORT" \
  </dev/null >"$VERIFY_RUN_DIR/next.log" 2>&1 &
NEXT_PID=$!

CHROME_ARGS=(
  --disable-gpu
  --no-sandbox
  --disable-dev-shm-usage
  --disable-background-networking
  --disable-default-apps
  --disable-extensions
  --disable-sync
  --no-first-run
  --metrics-recording-only
  --remote-debugging-address="$VERIFY_APP_HOST"
  --remote-debugging-port="$VERIFY_CDP_PORT"
  --user-data-dir="$VERIFY_CHROME_PROFILE"
)
if [[ "$VERIFY_HEADLESS" != "0" ]]; then
  CHROME_ARGS+=(--headless=new)
fi

mkdir -p "$VERIFY_CHROME_PROFILE"
"$CHROME_BIN" "${CHROME_ARGS[@]}" about:blank >"$VERIFY_RUN_DIR/chrome.log" 2>&1 &
CHROME_PID=$!

wait_port "$VERIFY_APP_HOST" "$VERIFY_EXECUTOR_PORT" "executor" 45
wait_port "$VERIFY_APP_HOST" "$VERIFY_APP_PORT" "next" 90
wait_port "$VERIFY_APP_HOST" "$VERIFY_CDP_PORT" "chrome cdp" 30

READY=""
for _ in $(seq 1 120); do
  BODY="$(http_body "$VERIFY_EXECUTOR_URL/health")"
  if [[ "$BODY" == *'"ok":true'* && "$BODY" == *'"mode":"mock"'* ]]; then
    HOME_BODY="$(http_body "$VERIFY_APP_URL/")"
    if [[ "$HOME_BODY" == *"Daily Code Challenge"* ]]; then
      READY=1
      break
    fi
  fi
  sleep 1
done
if [[ -z "$READY" ]]; then
  echo "stack did not become ready. See $VERIFY_RUN_DIR/*.log" >&2
  exit 1
fi

write_state
echo "launched $VERIFY_APP_URL (executor $VERIFY_EXECUTOR_URL, cdp $VERIFY_CDP_URL, db $VERIFY_PG_DATABASE)"
"$SCRIPT_DIR/doctor.sh"
trap - ERR
