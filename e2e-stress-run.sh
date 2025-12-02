#!/usr/bin/env bash
set -uo pipefail

SUCCESS_FILE="/tmp/e2e-stress-run-success-count"

if [[ ! -f .env.development ]]; then
  echo "Missing .env.development file" >&2
  exit 1
fi

# Load dev environment variables so every Playwright run matches local stress conditions.
set -a
source .env.development
set +a

if [[ ! -f "$SUCCESS_FILE" ]]; then
  echo "0" > "$SUCCESS_FILE"
fi

while true; do
  CI=1 FORCE_COLOR=1 E2E_MOCKS=1 npx playwright test
  status=$?

  if [[ $status -eq 0 ]]; then
    count=$(<"$SUCCESS_FILE")
    if ! [[ "$count" =~ ^[0-9]+$ ]]; then
      count=0
    fi
    count=$((count + 1))
    echo "$count" > "$SUCCESS_FILE"
    echo "Number of successful runs: $count"
  else
    count=$(<"$SUCCESS_FILE")
    if ! [[ "$count" =~ ^[0-9]+$ ]]; then
      count=0
    fi
    echo "Number of successful runs before failure: $count"
    exit $status
  fi

done
