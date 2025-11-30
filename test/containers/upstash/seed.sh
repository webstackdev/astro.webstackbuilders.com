#!/bin/sh
set -euo pipefail

REDIS_HOST="${REDIS_HOST:-upstash-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
SEED_DIR="/seeds"

if [ ! -d "$SEED_DIR" ]; then
  echo "[upstash-seed] Seed directory not mounted; skipping"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[upstash-seed] Installing jq for JSON parsing"
  apk add --no-cache jq >/dev/null 2>&1
fi

SEED_APPLIED=false
for file in "$SEED_DIR"/*.json; do
  if [ ! -f "$file" ]; then
    continue
  fi

  SEED_APPLIED=true
  TYPE=$(jq -r '.type' "$file")
  KEY=$(jq -r '.key' "$file")

  echo "[upstash-seed] Applying $TYPE seed from $(basename "$file")"

  case "$TYPE" in
    queue)
      jq -c '.items[]' "$file" | while read -r item; do
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" LPUSH "$KEY" "$item" >/dev/null
      done
      ;;
    hash)
      jq -c '.items[]' "$file" | while read -r item; do
        FIELD=$(echo "$item" | jq -r '.field')
        VALUE=$(echo "$item" | jq -r '.value')
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" HSET "$KEY" "$FIELD" "$VALUE" >/dev/null
      done
      ;;
    string)
      VALUE=$(jq -r '.value' "$file")
      redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SET "$KEY" "$VALUE" >/dev/null
      ;;
    *)
      echo "[upstash-seed] Unknown seed type '$TYPE' in $file" >&2
      ;;
  esac

done

if [ "$SEED_APPLIED" = false ]; then
  echo "[upstash-seed] No seed files found"
fi
