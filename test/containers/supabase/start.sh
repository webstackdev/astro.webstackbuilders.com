#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../../../" && pwd)
SUPABASE_DIR="${REPO_ROOT}/suprabase"
ENV_FILE="${REPO_ROOT}/test/containers/.env"
ROOT_ENV_FILE="${REPO_ROOT}/.env"
DEV_ENV_FILE="${REPO_ROOT}/.env.development"
DEFAULT_SUPABASE_URL="http://127.0.0.1:54321"
DEFAULT_HEALTH_TIMEOUT=240
declare -a SUPABASE_PORTS=(54320 54321 54322 54323 54324 54325 54326 54327 54328 54329)

free_port() {
  local port="$1"
  local pid

  pid=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pid" ]; then
    local proc
    proc=$(ps -p "$pid" -o comm= 2>/dev/null || true)
    if [ "$proc" = "rootlessport" ]; then
      echo "Releasing stale rootlessport listener on :$port (pid $pid)"
      kill "$pid" >/dev/null 2>&1 || true
      sleep 1
    else
      echo "Port $port is in use by $proc (pid $pid). Supabase may fail to start." >&2
    fi
  fi
}

if [ -f "$ROOT_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ROOT_ENV_FILE"
  set +a
fi

if [ -f "$DEV_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$DEV_ENV_FILE"
  set +a
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [ ! -d "$SUPABASE_DIR" ]; then
  echo "Supabase project directory not found. Expected '$SUPABASE_DIR'." >&2
  exit 1
fi

SUPABASE_ENV_URL="${SUPABASE_URL:-$DEFAULT_SUPABASE_URL}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
HEALTH_TIMEOUT="${SUPABASE_HEALTH_TIMEOUT:-$DEFAULT_HEALTH_TIMEOUT}"
REALTIME_REPLICA_REGION="${SUPABASE_REALTIME_REPLICA_REGION:-us-east-1}"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is required for health checks. Update test/containers/.env" >&2
  exit 1
fi

npx supabase stop --workdir "$SUPABASE_DIR" >/dev/null 2>&1 || true

for port in "${SUPABASE_PORTS[@]}"; do
  free_port "$port"
done

export REPLICA_REGION="$REALTIME_REPLICA_REGION"
export SUPABASE_REALTIME_REPLICA_REGION="$REALTIME_REPLICA_REGION"

npx supabase start --workdir "$SUPABASE_DIR" --ignore-health-check

START_TIME=$(date +%s)
HEALTH_URL="${SUPABASE_ENV_URL%/}/rest/v1/?select=1"

while true; do
  if curl -fsS \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "$HEALTH_URL" >/dev/null; then
    echo "Supabase REST API is ready at $SUPABASE_ENV_URL"
    break
  fi

  NOW=$(date +%s)
  ELAPSED=$((NOW - START_TIME))
  if [ "$ELAPSED" -ge "$HEALTH_TIMEOUT" ]; then
    echo "Timed out waiting for Supabase after ${HEALTH_TIMEOUT}s" >&2
    exit 1
  fi

  sleep 5
  echo "Waiting for Supabase... (${ELAPSED}s)"

done
