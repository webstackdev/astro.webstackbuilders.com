#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

actions_root="${repo_root}/.github/actions"
vite_config="${repo_root}/.github/helpers/vite.config.ts"

if [[ ! -d "${actions_root}" ]]; then
  echo "No actions directory found at ${actions_root}" >&2
  exit 0
fi

built_any=false

for dir in "${actions_root}"/*; do
  [[ -d "${dir}" ]] || continue
  [[ -f "${dir}/action.yml" ]] || continue
  [[ -f "${dir}/src/index.ts" ]] || continue

  built_any=true
  echo "Building ${dir}"
  ACTION_DIR="${dir}" npm exec vite -- build -c "${vite_config}"
done

if [[ "${built_any}" == "false" ]]; then
  echo "No buildable actions found under ${actions_root}" >&2
fi
