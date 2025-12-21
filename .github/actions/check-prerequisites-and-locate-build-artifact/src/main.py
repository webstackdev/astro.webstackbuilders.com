from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import requests
from actions_toolkit import core


@dataclass(frozen=True)
class WorkflowDescriptor:
    id: str
    label: str


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")
    return raw if raw.endswith("/") else f"{raw}/"


def create_headers(token: str, user_agent: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": user_agent,
    }


def is_allowed_fetch_url(url: str, allowed_hosts: set[str]) -> bool:
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname in allowed_hosts


def fetch_json(url: str, *, token: str, allowed_hosts: set[str], user_agent: str) -> tuple[bool, int, Any | None]:
    if not is_allowed_fetch_url(url, allowed_hosts):
        raise ValueError(f"Blocked outbound request to untrusted URL: {url}")

    response = requests.get(url, headers=create_headers(token, user_agent), timeout=30)
    if not response.ok:
        return False, response.status_code, None
    return True, response.status_code, response.json()


def parse_required_workflows(raw: str) -> list[WorkflowDescriptor]:
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("required-workflows-json must be a JSON array")

    workflows: list[WorkflowDescriptor] = []
    for entry in data:
        if not isinstance(entry, dict):
            raise ValueError("required-workflows-json entries must be objects")
        wf_id = (entry.get("id") or "").strip()
        label = (entry.get("label") or wf_id).strip()
        if not wf_id:
            raise ValueError("required-workflows-json entry missing id")
        workflows.append(WorkflowDescriptor(id=wf_id, label=label))

    return workflows


def list_successful_run_id_for_workflow(
    *, owner: str, repo: str, workflow_id: str, sha: str, token: str, allowed_hosts: set[str]
) -> int | None:
    base = get_github_api_base_url()
    url = f"{base}repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs?head_sha={sha}&status=completed&per_page=10"
    ok, status, data = fetch_json(
        url,
        token=token,
        allowed_hosts=allowed_hosts,
        user_agent="webstackbuilders-check-prerequisites-and-locate-build-artifact-action",
    )
    if not ok:
        raise RuntimeError(f"Unable to list workflow runs for {workflow_id} (status {status}).")

    runs = (data or {}).get("workflow_runs") or []
    for workflow_run in runs:
        if (workflow_run or {}).get("conclusion") == "success":
            run_id = (workflow_run or {}).get("id")
            return int(run_id) if isinstance(run_id, int) else None

    return None


def find_artifact_download_url(
    *, owner: str, repo: str, run_id: int, artifact_name: str, token: str, allowed_hosts: set[str]
) -> str | None:
    base = get_github_api_base_url()
    url = f"{base}repos/{owner}/{repo}/actions/runs/{run_id}/artifacts?per_page=100"
    ok, status, data = fetch_json(
        url,
        token=token,
        allowed_hosts=allowed_hosts,
        user_agent="webstackbuilders-check-prerequisites-and-locate-build-artifact-action",
    )
    if not ok:
        raise RuntimeError(f"Unable to list artifacts for workflow run (status {status}).")

    artifacts = (data or {}).get("artifacts") or []
    for artifact in artifacts:
        if (artifact or {}).get("name") == artifact_name:
            url = (artifact or {}).get("archive_download_url")
            return str(url) if url else None

    return None


def run() -> None:
    try:
        token = core.get_input("github-token", required=True)
        sha = core.get_input("sha", required=True).strip()
        trigger_event = core.get_input("trigger-event")
        head_branch = core.get_input("head-branch")
        is_fork = (core.get_input("is-fork") or "false").strip().lower() == "true"
        skip_hotfix = (core.get_input("skip-hotfix") or "false").strip().lower() == "true"
        skip_forks = (core.get_input("skip-forks") or "false").strip().lower() == "true"
        require_trigger_event = (core.get_input("require-trigger-event") or "").strip()
        build_workflow_file = core.get_input("build-workflow-file", required=True).strip()
        artifact_name = core.get_input("artifact-name", required=True).strip()
        required_workflows = parse_required_workflows(core.get_input("required-workflows-json", required=True))

        if require_trigger_event and trigger_event and trigger_event != require_trigger_event:
            core.notice(
                f"Skipping deploy; trigger event {trigger_event!r} does not match required {require_trigger_event!r}."
            )
            core.set_output("should_deploy", "false")
            return

        if skip_hotfix and head_branch.startswith("hotfix/"):
            core.notice("Skipping deploy for hotfix/* branch.")
            core.set_output("should_deploy", "false")
            return

        if skip_forks and is_fork:
            core.notice("Skipping deploy for forked pull request.")
            core.set_output("should_deploy", "false")
            return

        repo_full = (os.environ.get("GITHUB_REPOSITORY") or "").strip()
        if "/" not in repo_full:
            raise ValueError("Missing GITHUB_REPOSITORY.")
        owner, repo = repo_full.split("/", 1)

        allowed_hosts = {urlparse(get_github_api_base_url()).hostname}

        missing_or_failed: list[str] = []
        successful_runs: dict[str, int] = {}
        for wf in required_workflows:
            run_id = list_successful_run_id_for_workflow(
                owner=owner,
                repo=repo,
                workflow_id=wf.id,
                sha=sha,
                token=token,
                allowed_hosts=allowed_hosts,
            )
            if not run_id:
                missing_or_failed.append(wf.label)
            else:
                successful_runs[wf.id] = run_id

        if missing_or_failed:
            core.notice(f"Skipping deploy; prerequisites not met for {sha}: {', '.join(missing_or_failed)}")
            core.set_output("should_deploy", "false")
            return

        build_run_id = successful_runs.get(build_workflow_file)
        if not build_run_id:
            core.notice(f"Skipping deploy; missing build run for {build_workflow_file} ({sha}).")
            core.set_output("should_deploy", "false")
            return

        artifact_download_url = find_artifact_download_url(
            owner=owner,
            repo=repo,
            run_id=build_run_id,
            artifact_name=artifact_name,
            token=token,
            allowed_hosts=allowed_hosts,
        )
        if not artifact_download_url:
            core.notice(f"Skipping deploy; missing artifact {artifact_name} for run {build_run_id}.")
            core.set_output("should_deploy", "false")
            return

        core.set_output("should_deploy", "true")
        core.set_output("artifact_download_url", artifact_download_url)
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
