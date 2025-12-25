from __future__ import annotations

import json
import textwrap
import urllib.error
import urllib.request
from typing import Any

from context import Context


def github_api_request(
    *,
    token: str,
    method: str,
    url: str,
    body: dict[str, Any] | None = None,
) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "webstackbuilders-deploy-to-vercel-action",
    }

    data: bytes | None = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, method=method.upper(), headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub API {method} {url} failed ({exc.code}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"GitHub API {method} {url} failed: {exc}") from exc


class GitHubClient:
    def __init__(self, ctx: Context) -> None:
        self.ctx = ctx
        self.base = "https://api.github.com"
        self.deployment_id: int | None = None

    def create_deployment(self) -> dict[str, Any]:
        url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/deployments"
        environment = self.ctx.github_deployment_env or ("Production" if self.ctx.production else "Preview")
        payload = {
            "ref": self.ctx.ref,
            "required_contexts": [],
            "environment": environment,
            "description": "Deploy to Vercel",
            "auto_merge": False,
        }
        data = github_api_request(token=self.ctx.github_token, method="POST", url=url, body=payload) or {}
        deployment_id = int(data.get("id") or 0)
        self.deployment_id = deployment_id or None
        return data

    def update_deployment(self, state: str, url: str | None = None) -> dict[str, Any] | None:
        if not self.deployment_id:
            return None

        api_url = (
            f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/deployments/{self.deployment_id}/statuses"
        )
        payload = {
            "state": state,
            "log_url": self.ctx.log_url,
            "environment_url": url or self.ctx.log_url,
            "description": "Starting deployment to Vercel",
        }
        return github_api_request(token=self.ctx.github_token, method="POST", url=api_url, body=payload)

    def list_pr_comments(self) -> list[dict[str, Any]]:
        if not self.ctx.pr_number:
            return []
        url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/issues/{self.ctx.pr_number}/comments"
        data = github_api_request(token=self.ctx.github_token, method="GET", url=url)
        return list(data or [])

    def delete_comment(self, comment_id: int) -> None:
        url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/issues/comments/{comment_id}"
        github_api_request(token=self.ctx.github_token, method="DELETE", url=url)

    def delete_existing_comment(self) -> int | None:
        comments = self.list_pr_comments()
        for comment in comments:
            body = str((comment or {}).get("body") or "")
            if "This pull request has been deployed to Vercel." in body:
                comment_id = int((comment or {}).get("id") or 0)
                if comment_id:
                    self.delete_comment(comment_id)
                    return comment_id
        return None

    def create_comment(self, body: str) -> dict[str, Any]:
        if not self.ctx.pr_number:
            raise ValueError("Cannot create PR comment without PR context")
        url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/issues/{self.ctx.pr_number}/comments"
        dedented = textwrap.dedent(body).strip("\n")
        payload = {"body": dedented}
        return github_api_request(token=self.ctx.github_token, method="POST", url=url, body=payload) or {}

    def add_labels(self, labels: list[str]) -> list[dict[str, Any]]:
        if not self.ctx.pr_number:
            return []
        url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/issues/{self.ctx.pr_number}/labels"
        payload = {"labels": labels}
        data = github_api_request(token=self.ctx.github_token, method="POST", url=url, body=payload)
        return list(data or [])

    def get_commit(self) -> dict[str, str]:
        url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/commits/{self.ctx.ref}"
        data = github_api_request(token=self.ctx.github_token, method="GET", url=url) or {}
        commit = (data.get("commit") or {})
        author = (commit.get("author") or {})

        author_name = str(author.get("name") or "").strip()
        commit_message = str(commit.get("message") or "").strip()
        author_login = str(((data.get("author") or {}).get("login") or "")).strip()
        return {
            "authorName": author_name,
            "authorLogin": author_login,
            "commitMessage": commit_message,
        }
