from __future__ import annotations

import json
import os
import re
from typing import Any
from urllib.parse import urlencode, urlparse

import requests
from actions_toolkit import core


COMMENT_TAG = "<!-- vercel-preview-card -->"
comment_tag = COMMENT_TAG  # pylint: disable=invalid-name


def is_vercel_url(value: Any) -> bool:
    return isinstance(value, str) and re.search(r"vercel\.(app|com)", value) is not None


def build_preview_comment_body(params: dict[str, str]) -> str:
    branch = params["branch"]
    sha = params["sha"]
    owner = params["owner"]
    repo = params["repo"]
    preview_url = params["previewUrl"]
    triggered_by = params["triggeredBy"]

    short_sha = sha[:7] if sha else "unknown"
    commit_url = (
        f"https://github.com/{owner}/{repo}/commit/{sha}" if sha else f"https://github.com/{owner}/{repo}"
    )

    preview_link = (
        f"| Preview | <a href=\"{preview_url}\" target=\"_blank\" rel=\"noopener noreferrer\">"
        "Open preview</a> |"
    )

    return "\n".join(
        [
            COMMENT_TAG,
            "✅ **Preview deployment ready**",
            "",
            "| Field | Value |",
            "| --- | --- |",
            f"| Branch | `{branch}` |",
            f"| Commit | [{short_sha}]({commit_url}) |",
            preview_link,
            "",
            f"_Triggered by {triggered_by}_",
        ]
    )


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
        "User-Agent": "webstackbuilders-update-status-on-preview-deployment-success-action",
    }


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")
    return raw if raw.endswith("/") else f"{raw}/"


def is_allowed_fetch_url(url: str, allowed_hosts: set[str]) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False
    return parsed.hostname in allowed_hosts


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


def get_actor_markdown(workflow_run: dict[str, Any] | None, fallback: str) -> str:
    workflow_run = workflow_run or {}

    actor_login: str | None
    actor_url: str | None

    actor_value = workflow_run.get("actor")
    if isinstance(actor_value, str):
        actor_login = actor_value
        actor_url = None
    else:
        actor_login = (actor_value or {}).get("login")
        actor_url = (actor_value or {}).get("html_url")

    actor = actor_login or fallback or "workflow_run"
    actor_display = actor if actor.startswith("@") else f"@{actor}"

    if actor_url:
        return f"[{actor_display}]({actor_url})"
    if actor_login and not isinstance(actor_value, str):
        return f"[{actor_display}](https://github.com/{actor_login})"

    return actor_display


def resolve_vercel_preview_url(*, raw_preview_url: str, sha: str) -> str | None:
    preview_url = raw_preview_url.strip()
    if is_vercel_url(preview_url):
        return preview_url

    vercel_token = (os.environ.get("VERCEL_TOKEN") or "").strip()
    vercel_project_id = (os.environ.get("VERCEL_PROJECT_ID") or "").strip()
    if not vercel_token or not vercel_project_id:
        core.info("Missing Vercel credentials cannot query deployment API.")
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


def find_existing_comment(*, owner: str, repo: str, issue_number: int, token: str, tag: str) -> dict[str, Any] | None:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    headers = create_github_request_headers(token)

    for page in range(1, 51):
        url = f"{base_url}repos/{owner}/{repo}/issues/{issue_number}/comments?per_page=100&page={page}"
        ok, status, data = fetch_json("GET", url, allowed_hosts=allowed_hosts, headers=headers)
        if not ok:
            core.warning(f"Unable to list PR comments (status {status}).")
            return None

        comments = data or []
        found = next((comment for comment in comments if tag in ((comment or {}).get("body") or "")), None)
        if found:
            return found

        if len(comments) < 100:
            return None

    return None


def upsert_comment(
    *,
    owner: str,
    repo: str,
    issue_number: int,
    token: str,
    body: str,
    existing_comment_id: int | None = None,
) -> None:
    base_url = get_github_api_base_url()
    allowed_hosts = {urlparse(base_url).hostname}

    headers = {**create_github_request_headers(token), "Content-Type": "application/json"}

    if existing_comment_id:
        url = f"{base_url}repos/{owner}/{repo}/issues/comments/{existing_comment_id}"
        ok, status, _ = fetch_json(
            "PATCH",
            url,
            allowed_hosts=allowed_hosts,
            headers=headers,
            json_body={"body": body},
        )
        if not ok:
            raise RuntimeError(f"Unable to update PR comment (status {status}).")
        return

    url = f"{base_url}repos/{owner}/{repo}/issues/{issue_number}/comments"
    ok, status, _ = fetch_json(
        "POST",
        url,
        allowed_hosts=allowed_hosts,
        headers=headers,
        json_body={"body": body},
    )

    if not ok:
        raise RuntimeError(f"Unable to create PR comment (status {status}).")


def run() -> None:
    try:
        github_token = core.get_input("github-token", required=True)
        raw_preview_url = core.get_input("preview-url")

        event_path = get_required_env("GITHUB_EVENT_PATH")
        payload = get_json_from_file(event_path)

        workflow_run = (payload or {}).get("workflow_run") or {}
        pr = ((workflow_run.get("pull_requests") or [])[:1] or [None])[0]

        if not (pr or {}).get("number"):
            core.warning("Missing pull request metadata skipping preview success comment.")
            return

        owner = (((payload or {}).get("repository") or {}).get("owner") or {}).get("login")
        repo = ((payload or {}).get("repository") or {}).get("name")

        if not owner or not repo:
            core.set_failed("Missing repository metadata in event payload.")
            return

        branch = workflow_run.get("head_branch") or "unknown-branch"
        sha = workflow_run.get("head_sha") or ""

        actor_fallback = (os.environ.get("GITHUB_ACTOR") or "").strip() or "workflow_run"
        triggered_by = get_actor_markdown(workflow_run, actor_fallback)

        preview_url = resolve_vercel_preview_url(raw_preview_url=raw_preview_url, sha=sha)
        if not is_vercel_url(preview_url):
            core.warning("Unable to resolve Vercel preview URL skipping preview success comment.")
            return

        body = build_preview_comment_body(
            {
                "branch": branch,
                "sha": sha,
                "owner": owner,
                "repo": repo,
                "previewUrl": preview_url,
                "triggeredBy": triggered_by,
            }
        )

        existing = find_existing_comment(
            owner=owner,
            repo=repo,
            issue_number=int(pr["number"]),
            token=github_token,
            tag=COMMENT_TAG,
        )

        upsert_comment(
            owner=owner,
            repo=repo,
            issue_number=int(pr["number"]),
            token=github_token,
            body=body,
            existing_comment_id=(existing or {}).get("id"),
        )
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
