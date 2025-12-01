#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../../../" && pwd)
SUPABASE_DIR="${REPO_ROOT}/suprabase"
CONFIG_FILE="${SUPABASE_DIR}/config.toml"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Supabase config file not found at $CONFIG_FILE" >&2
  exit 1
fi

PROJECT_ID=$(grep -m1 '^project_id' "$CONFIG_FILE" | awk -F '"' '{print $2}')
if [ -z "$PROJECT_ID" ]; then
  echo "Unable to determine Supabase project_id from $CONFIG_FILE" >&2
  exit 1
fi

RAW_COMPOSE_PROJECT_NAME="$PROJECT_ID"
SANITIZED_COMPOSE_PROJECT_NAME=$(echo "$PROJECT_ID" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to tail Supabase logs" >&2
  exit 1
fi

collect_containers() {
  local project_name="$1"
  docker ps --filter "label=com.docker.compose.project=${project_name}" --format '{{.ID}} {{.Names}}'
}

mapfile -t CONTAINER_INFO < <(collect_containers "$RAW_COMPOSE_PROJECT_NAME")

if [ ${#CONTAINER_INFO[@]} -eq 0 ] && [ "$RAW_COMPOSE_PROJECT_NAME" != "$SANITIZED_COMPOSE_PROJECT_NAME" ]; then
  mapfile -t CONTAINER_INFO < <(collect_containers "$SANITIZED_COMPOSE_PROJECT_NAME")
fi

if [ ${#CONTAINER_INFO[@]} -eq 0 ]; then
  echo "No running Supabase containers found for project '${PROJECT_ID}'. Is Supabase running?" >&2
  exit 1
fi

echo "Tailing logs for Supabase project '${PROJECT_ID}' (${#CONTAINER_INFO[@]} containers)..."

TAIL_PIDS=()

cleanup() {
  for pid in "${TAIL_PIDS[@]}"; do
    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT INT TERM

for entry in "${CONTAINER_INFO[@]}"; do
  container_id="${entry%% *}"
  container_name="${entry#* }"

  (
    docker logs -f "$container_id" 2>&1 | sed -e "s/^/[${container_name}] /"
  ) &
  TAIL_PIDS+=($!)
done

wait
