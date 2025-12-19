from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal
from urllib.parse import urlparse

import requests
from actions_toolkit import core


CHECK_NAME = "Deploy Preview to Vercel"


@dataclass(frozen=True)
class WorkflowRunPayload:
    head_sha: str
    head_branch: str
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


def get_optional_input_or_env(input_name: str, env_name: str) -> str:
    value = core.get_input(input_name).strip()
    if value:
        return value
    return (os.environ.get(env_name) or "").strip()


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
        "User-Agent": "webstackbuilders-add-checks-for-workflow-runs-action",
    }


def request_json(
    method: str,
    url: str,
    *,
    allowed_hosts: set[str],
    token: str,
    json_body: Any | None = None,
) -> tuple[bool, int, Any | None]:
    if not is_allowed_fetch_url(url, allowed_hosts):
        raise ValueError(f"Blocked outbound request to untrusted URL: {url}")

    headers = create_github_request_headers(token)
    if json_body is not None:
        headers = {**headers, "Content-Type": "application/json"}

    response = requests.request(method, url, headers=headers, json=json_body, timeout=30)
    if not response.ok:
        return False, response.status_code, None

    if response.status_code == 204:
        return True, response.status_code, None

    return True, response.status_code, response.json()


def parse_payload(payload: Any) -> WorkflowRunPayload:
    workflow_run = (payload or {}).get("workflow_run") or {}
    repository = (payload or {}).get("repository") or {}

    head_sha = (workflow_run.get("head_sha") or "").strip()
    head_branch = (workflow_run.get("head_branch") or "").strip()

    owner = ((repository.get("owner") or {}).get("login") or "").strip()
    repo = (repository.get("name") or "").strip()

    return WorkflowRunPayload(head_sha=head_sha, head_branch=head_branch, owner=owner, repo=repo)


def list_check_runs_for_ref(*, owner: str, repo: str, sha: str, token: str) -> list[dict[str, Any]]:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    url = (
        f"{base_url}repos/{owner}/{repo}/commits/{sha}/check-runs"
        "?filter=latest&per_page=100"
    )
    ok, status, data = request_json("GET", url, allowed_hosts=allowed_hosts, token=token)
    if not ok:
        raise RuntimeError(f"Unable to list check runs (status {status}).")

    return (data or {}).get("check_runs") or []


def upsert_check_run(
    *,
    owner: str,
    repo: str,
    sha: str,
    token: str,
    conclusion: Literal["success", "failure"],
    summary: str,
    details_url: str,
) -> None:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    completed_at = datetime.now(timezone.utc).isoformat()
    output = {
        "title": CHECK_NAME,
        "summary": f"{summary}\n\nDetails: {details_url}",
    }

    existing = next(
        (
            run
            for run in list_check_runs_for_ref(owner=owner, repo=repo, sha=sha, token=token)
            if run.get("name") == CHECK_NAME
        ),
        None,
    )

    if existing and isinstance(existing.get("id"), int):
        url = f"{base_url}repos/{owner}/{repo}/check-runs/{existing['id']}"
        ok, status, _ = request_json(
            "PATCH",
            url,
            allowed_hosts=allowed_hosts,
            token=token,
            json_body={
                "status": "completed",
                "conclusion": conclusion,
                "completed_at": completed_at,
                "output": output,
                "details_url": details_url,
            },
        )
        if not ok:
            raise RuntimeError(f"Unable to update check run (status {status}).")
        return

    url = f"{base_url}repos/{owner}/{repo}/check-runs"
    ok, status, _ = request_json(
        "POST",
        url,
        allowed_hosts=allowed_hosts,
        token=token,
        json_body={
            "name": CHECK_NAME,
            "head_sha": sha,
            "status": "completed",
            "conclusion": conclusion,
            "completed_at": completed_at,
            "output": output,
            "details_url": details_url,
        },
    )

    if not ok:
        raise RuntimeError(f"Unable to create check run (status {status}).")


def run() -> None:
    try:
        github_token = core.get_input("github-token", required=True)

        event_path = get_required_env("GITHUB_EVENT_PATH")
        payload = get_json_from_file(event_path)
        parsed = parse_payload(payload)

        if not parsed.head_sha:
            core.warning("Missing workflow_run.head_sha; cannot publish check run.")
            return

        if not parsed.owner or not parsed.repo:
            core.set_failed("Missing repository metadata in event payload.")
            return

        is_hotfix = parsed.head_branch.startswith("hotfix/")

        verify_result = get_optional_input_or_env("verify-result", "VERIFY_RESULT") or "unknown"
        deploy_result = get_optional_input_or_env("deploy-result", "DEPLOY_RESULT") or "unknown"
        preview_url = get_optional_input_or_env("preview-url", "PREVIEW_URL")

        run_id = (os.environ.get("GITHUB_RUN_ID") or "").strip()
        if run_id:
            details_url = f"https://github.com/{parsed.owner}/{parsed.repo}/actions/runs/{run_id}"
        else:
            details_url = f"https://github.com/{parsed.owner}/{parsed.repo}"

        if is_hotfix:
            conclusion: Literal["success", "failure"] = "success"
            summary = "Hotfix branch: preview deploy intentionally skipped."
        elif verify_result != "success":
            conclusion = "failure"
            summary = f"CI verification failed ({verify_result})."
        elif deploy_result == "success":
            conclusion = "success"
            summary = f"Preview deployed: {preview_url}" if preview_url else "Preview deployed."
        else:
            conclusion = "failure"
            summary = f"Preview deployment failed ({deploy_result})."

        upsert_check_run(
            owner=parsed.owner,
            repo=parsed.repo,
            sha=parsed.head_sha,
            token=github_token,
            conclusion=conclusion,
            summary=summary,
            details_url=details_url,
        )

        core.info(f"Published check run: {CHECK_NAME} ({conclusion}).")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
