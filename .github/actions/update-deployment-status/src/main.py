from __future__ import annotations

import os
from urllib.parse import urlparse

import requests
from actions_toolkit import core


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")
    return raw if raw.endswith("/") else f"{raw}/"


def run() -> None:
    try:
        token = core.get_input("github-token", required=True)
        deployment_id = core.get_input("deployment-id", required=True).strip()
        exit_code = int(core.get_input("exit-code", required=True).strip() or "1")
        environment_url = (core.get_input("environment-url") or "").strip()
        success_description = core.get_input("success-description", required=True).strip()
        failure_description = core.get_input("failure-description", required=True).strip()

        repo_full = (os.environ.get("GITHUB_REPOSITORY") or "").strip()
        if "/" not in repo_full:
            raise ValueError("Missing GITHUB_REPOSITORY")
        owner, repo = repo_full.split("/", 1)

        run_id = (os.environ.get("GITHUB_RUN_ID") or "").strip()
        server_url = (os.environ.get("GITHUB_SERVER_URL") or "https://github.com").strip()
        log_url = f"{server_url}/{owner}/{repo}/actions/runs/{run_id}" if run_id else None

        base = get_github_api_base_url()
        url = f"{base}repos/{owner}/{repo}/deployments/{deployment_id}/statuses"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "webstackbuilders-update-deployment-status-action",
        }

        is_success = exit_code == 0
        body: dict[str, object] = {
            "state": "success" if is_success else "failure",
            "description": success_description if is_success else failure_description,
        }
        if environment_url:
            body["environment_url"] = environment_url
        if log_url:
            body["log_url"] = log_url

        response = requests.post(url, headers=headers, json=body, timeout=30)
        if not response.ok:
            raise RuntimeError(f"Failed to create deployment status (status {response.status_code}).")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
