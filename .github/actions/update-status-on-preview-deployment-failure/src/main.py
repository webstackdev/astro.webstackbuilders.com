from __future__ import annotations

import json
import os
import re
from typing import Any
from urllib.parse import urlencode, urlparse

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


def is_vercel_url(value: Any) -> bool:
    return isinstance(value, str) and re.search(r"vercel\.(app|com)", value) is not None


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
    headers: dict[str, str] | None = None,
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


def create_github_request_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "webstackbuilders-update-status-on-preview-deployment-failure-action",
    }


def resolve_vercel_deployment_url(*, raw_preview_url: str, sha: str) -> str | None:
    candidate = raw_preview_url.strip()
    if is_vercel_url(candidate):
        return candidate

    vercel_token = (os.environ.get("VERCEL_TOKEN") or "").strip()
    vercel_project_id = (os.environ.get("VERCEL_PROJECT_ID") or "").strip()
    if not vercel_token or not vercel_project_id:
        core.info("Missing Vercel credentials; cannot query deployment API.")
        return None

    query: dict[str, str] = {
        "projectId": vercel_project_id,
        "meta-githubCommitSha": sha or "",
        "limit": "1",
    }

    vercel_org_id = (os.environ.get("VERCEL_ORG_ID") or "").strip()
    if vercel_org_id:
        query["teamId"] = vercel_org_id

    url = f"https://api.vercel.com/v6/deployments?{urlencode(query)}"
    ok, status, data = fetch_json(
        "GET",
        url,
        allowed_hosts={"api.vercel.com"},
        headers={"Authorization": f"Bearer {vercel_token}"},
    )

    if not ok:
        core.warning(f"Unable to fetch deployment info (status {status}).")
        return None

    deployments = (data or {}).get("deployments") or []
    deployment = deployments[0] if deployments else None

    deployment_url = (deployment or {}).get("url")
    inspector_url = (deployment or {}).get("inspectorUrl")

    if deployment_url:
        return f"https://{deployment_url}"
    if inspector_url:
        return inspector_url if inspector_url.startswith("http") else f"https://{inspector_url}"

    return None


def create_pr_comment(*, owner: str, repo: str, issue_number: int, token: str, body: str) -> None:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    url = f"{base_url}repos/{owner}/{repo}/issues/{issue_number}/comments"
    headers = {**create_github_request_headers(token), "Content-Type": "application/json"}
    ok, status, _ = fetch_json(
        "POST",
        url,
        allowed_hosts=allowed_hosts,
        headers=headers,
        json_body={"body": body},
    )
    if not ok:
        raise RuntimeError(f"Unable to create PR comment (status {status}).")


def build_failure_comment_body(*, target_url: str, is_fallback_run_url: bool) -> str:
    link_text = "View the workflow logs" if is_fallback_run_url else "Open the failed Vercel deployment"
    link_line = f"\n\n🔗 [{link_text}]({target_url})"
    return f"❌ Preview deployment failed.{link_line}\n\nPlease review the Vercel build logs for details."


def run() -> None:
    try:
        github_token = core.get_input("github-token", required=True)
        raw_preview_url = core.get_input("preview-url")

        event_path = get_required_env("GITHUB_EVENT_PATH")
        payload = get_json_from_file(event_path)

        workflow_run = (payload or {}).get("workflow_run") or {}
        pr = ((workflow_run.get("pull_requests") or [])[:1] or [None])[0]

        if not (pr or {}).get("number"):
            core.warning("No pull request metadata available; skipping preview failure comment.")
            return

        owner = (((payload or {}).get("repository") or {}).get("owner") or {}).get("login")
        repo = ((payload or {}).get("repository") or {}).get("name")

        if not owner or not repo:
            core.set_failed("Missing repository metadata in event payload.")
            return

        run_id = (os.environ.get("GITHUB_RUN_ID") or "").strip()
        fallback_run_url = f"https://github.com/{owner}/{repo}/actions/runs/{run_id}"

        sha = workflow_run.get("head_sha") or ""
        failed_deployment_url = (
            resolve_vercel_deployment_url(raw_preview_url=raw_preview_url, sha=sha) or fallback_run_url
        )

        body = build_failure_comment_body(
            target_url=failed_deployment_url,
            is_fallback_run_url=failed_deployment_url == fallback_run_url,
        )

        create_pr_comment(owner=owner, repo=repo, issue_number=int(pr["number"]), token=github_token, body=body)
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
