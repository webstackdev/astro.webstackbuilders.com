from __future__ import annotations

import os
from urllib.parse import urlparse

import requests
from actions_toolkit import core


def get_input_compat(name: str, *, required: bool = False) -> str:
    value = core.get_input(name, required=False)
    if value:
        return value.strip()

    normalized = name.replace(" ", "_").upper()
    candidates = {normalized, normalized.replace("-", "_"), normalized.replace("_", "-")}
    for candidate in candidates:
        env_value = os.getenv(f"INPUT_{candidate}", "")
        if env_value:
            return env_value.strip()

    if required:
        return core.get_input(name, required=True)
    return ""


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")
    return raw if raw.endswith("/") else f"{raw}/"


def run() -> None:
    try:
        token = get_input_compat("token", required=True)
        sha = get_input_compat("sha", required=True).strip()

        repo_full = (os.environ.get("GITHUB_REPOSITORY") or "").strip()
        if "/" not in repo_full:
            raise ValueError("Missing GITHUB_REPOSITORY")
        owner, repo = repo_full.split("/", 1)

        base = get_github_api_base_url()
        url = f"{base}repos/{owner}/{repo}/deployments"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "webstackbuilders-create-github-deployment-preview-action",
        }
        body = {
            "ref": sha,
            "environment": "preview",
            "auto_merge": False,
            "required_contexts": [],
            "transient_environment": True,
            "production_environment": False,
            "description": "Deploying to Vercel (preview)",
        }

        response = requests.post(url, headers=headers, json=body, timeout=30)
        if not response.ok:
            raise RuntimeError(f"Failed to create deployment (status {response.status_code}).")

        deployment_id = (response.json() or {}).get("id")
        if not isinstance(deployment_id, int):
            raise RuntimeError("Deployment id missing from response")

        core.set_output("deployment_id", str(deployment_id))
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
