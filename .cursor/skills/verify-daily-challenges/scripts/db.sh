#!/usr/bin/env bash
# Read-only psql against the verify database. Pass a SQL string or run stdin.
set -euo pipefail

# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
load_state

export PGPASSWORD="$VERIFY_PG_PASSWORD"
URL="${VERIFY_DATABASE_URL:-postgresql://${VERIFY_PG_USER}:${VERIFY_PG_PASSWORD}@${VERIFY_PG_HOST}:${VERIFY_PG_PORT}/${VERIFY_PG_DATABASE}}"

if [[ $# -gt 0 ]]; then
  psql "$URL" -v ON_ERROR_STOP=1 -c "$*"
else
  psql "$URL" -v ON_ERROR_STOP=1
fi
