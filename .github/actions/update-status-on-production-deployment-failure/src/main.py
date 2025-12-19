from __future__ import annotations

import json
import os
from typing import Any
from urllib.parse import urlparse

import requests
from actions_toolkit import core


def get_required_env(name: str) -> str:
    value = (os.environ.get(name) or "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_json_from_file(file_path: str) -> Any:
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def create_github_request_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "webstackbuilders-update-status-on-production-deployment-failure-action",
    }


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")
    return raw if raw.endswith("/") else f"{raw}/"


def is_allowed_fetch_url(url: str, allowed_hosts: set[str]) -> bool:
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname in allowed_hosts


def fetch_json(
    method: str,
    url: str,
    *,
    allowed_hosts: set[str],
    headers: dict[str, str],
    json_body: Any | None = None,
) -> tuple[bool, int, Any | None]:
    if not is_allowed_fetch_url(url, allowed_hosts):
        raise ValueError(f"Blocked outbound request to untrusted URL: {url}")

    response = requests.request(method, url, headers=headers, json=json_body, timeout=30)
    if not response.ok:
        return False, response.status_code, None

    if response.status_code == 204:
        return True, response.status_code, None

    return True, response.status_code, response.json()


def build_production_failure_comment_body(target_url: str) -> str:
    trimmed_url = target_url.strip()
    return (
        f"❌ Production deployment failed.\n\n🔗 {trimmed_url}\n\nPlease review the Vercel logs."
        if trimmed_url
        else "❌ Production deployment failed. Please review the Vercel logs."
    )


def create_commit_comment(*, owner: str, repo: str, sha: str, token: str, body: str) -> None:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    url = f"{base_url}repos/{owner}/{repo}/commits/{sha}/comments"
    headers = {**create_github_request_headers(token), "Content-Type": "application/json"}

    ok, status, _ = fetch_json(
        "POST",
        url,
        allowed_hosts=allowed_hosts,
        headers=headers,
        json_body={"body": body},
    )

    if not ok:
        raise RuntimeError(f"Unable to create commit comment (status {status}).")


def run() -> None:
    try:
        github_token = core.get_input("github-token", required=True)
        preview_url = core.get_input("preview-url")

        event_path = get_required_env("GITHUB_EVENT_PATH")
        payload = get_json_from_file(event_path)

        workflow_run = (payload or {}).get("workflow_run") or {}
        sha = (workflow_run.get("head_sha") or "").strip()
        if not sha:
            core.warning("Missing workflow_run.head_sha; skipping production failure comment.")
            return

        owner = (((payload or {}).get("repository") or {}).get("owner") or {}).get("login")
        repo = ((payload or {}).get("repository") or {}).get("name")

        if not owner or not repo:
            core.set_failed("Missing repository metadata in event payload.")
            return

        body = build_production_failure_comment_body(preview_url)
        create_commit_comment(owner=owner, repo=repo, sha=sha, token=github_token, body=body)

        core.info("Commented on commit about production deployment failure.")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
