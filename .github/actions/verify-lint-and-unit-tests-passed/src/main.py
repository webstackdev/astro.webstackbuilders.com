from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import requests
from actions_toolkit import core


@dataclass(frozen=True)
class WorkflowRunPayload:
    run_id: int
    head_branch: str
    event: str
    owner: str
    repo: str


def get_required_env(name: str) -> str:
    value = (os.environ.get(name) or "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_json_from_file(file_path: str) -> Any:
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")

    return raw if raw.endswith("/") else f"{raw}/"


def is_allowed_fetch_url(url: str, allowed_hosts: set[str]) -> bool:
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname in allowed_hosts


def create_github_request_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "webstackbuilders-verify-lint-and-unit-tests-passed-action",
    }


def fetch_json(url: str, *, allowed_hosts: set[str], token: str) -> tuple[bool, int, Any | None]:
    if not is_allowed_fetch_url(url, allowed_hosts):
        raise ValueError(f"Blocked outbound request to untrusted URL: {url}")

    response = requests.get(url, headers=create_github_request_headers(token), timeout=30)
    if not response.ok:
        return False, response.status_code, None

    return True, response.status_code, response.json()


def list_all_jobs_for_run(*, owner: str, repo: str, run_id: int, token: str) -> list[dict[str, Any]]:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    all_jobs: list[dict[str, Any]] = []
    for page in range(1, 11):
        url = f"{base_url}repos/{owner}/{repo}/actions/runs/{run_id}/jobs?per_page=100&page={page}"
        ok, status, data = fetch_json(url, allowed_hosts=allowed_hosts, token=token)
        if not ok:
            raise RuntimeError(f"Unable to list jobs for workflow run (status {status}).")

        jobs = (data or {}).get("jobs") or []
        all_jobs.extend(jobs)
        if len(jobs) < 100:
            break

    return all_jobs


def parse_payload(payload: Any) -> WorkflowRunPayload:
    workflow_run = (payload or {}).get("workflow_run") or {}

    run_id = workflow_run.get("id")
    head_branch = (workflow_run.get("head_branch") or "").strip()
    event = (workflow_run.get("event") or "").strip()

    repository = (payload or {}).get("repository") or {}
    owner = ((repository.get("owner") or {}).get("login") or "").strip()
    repo = (repository.get("name") or "").strip()

    if not owner or not repo:
        raise ValueError("Missing repository metadata in event payload.")

    if not isinstance(run_id, int):
        raise ValueError("Missing workflow_run.id in event payload.")

    return WorkflowRunPayload(run_id=run_id, head_branch=head_branch, event=event, owner=owner, repo=repo)


def run() -> None:
    try:
        github_token = core.get_input("github-token", required=True)

        event_path = get_required_env("GITHUB_EVENT_PATH")
        payload = get_json_from_file(event_path)
        parsed = parse_payload(payload)

        is_hotfix = parsed.head_branch.startswith("hotfix/")
        if parsed.event == "pull_request" and is_hotfix:
            core.notice("Hotfix branch: skipping CI verification requirements.")
            return

        required_jobs = ["Lint", "Unit Tests"]
        jobs = list_all_jobs_for_run(owner=parsed.owner, repo=parsed.repo, run_id=parsed.run_id, token=github_token)

        missing: list[str] = []
        for required_name in required_jobs:
            job = next((entry for entry in jobs if entry.get("name") == required_name), None)
            if not job or job.get("conclusion") != "success":
                missing.append(required_name)

        if missing:
            core.set_failed(f"Required CI jobs missing or failed: {', '.join(missing)}")
            return

        core.info("Required CI jobs succeeded.")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
