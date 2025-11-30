#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../../" && pwd)
ENV_FILE="${REPO_ROOT}/test/containers/.env"
TIMEOUT=${WAIT_FOR_TIMEOUT:-120}

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

CONVERTKIT_PORT=${CONVERTKIT_HTTP_PORT:-9010}
RESEND_PORT=${RESEND_HTTP_PORT:-9011}
UPSTASH_PORT=${UPSTASH_HTTP_PORT:-8079}
UPSTASH_TOKEN=${UPSTASH_TOKEN:-local-dev-token}

wait_for() {
  local name=$1
  local url=$2
  local start
  start=$(date +%s)

  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "[wait] $name ready at $url"
      break
    fi

    local now elapsed
    now=$(date +%s)
    elapsed=$((now - start))

    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      echo "[wait] Timed out waiting for $name" >&2
      exit 1
    fi

    sleep 3
  done
}

wait_for "ConvertKit" "http://127.0.0.1:${CONVERTKIT_PORT}/__admin/mappings"
wait_for "Resend" "http://127.0.0.1:${RESEND_PORT}/__admin/mappings"

wait_for_upstash() {
  local name=$1
  local url=$2
  local start
  start=$(date +%s)

  while true; do
    if curl -fsS \
      -H "Authorization: Bearer ${UPSTASH_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '["PING"]' \
      "$url" >/dev/null 2>&1; then
      echo "[wait] $name ready at $url"
      break
    fi

    local now elapsed
    now=$(date +%s)
    elapsed=$((now - start))

    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      echo "[wait] Timed out waiting for $name" >&2
      exit 1
    fi

    sleep 3
  done
}

wait_for_upstash "Upstash REST" "http://127.0.0.1:${UPSTASH_PORT}/"
