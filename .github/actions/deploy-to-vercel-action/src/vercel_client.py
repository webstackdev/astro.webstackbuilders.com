from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from context import Context
from io_utils import log_info
from utils import exec_cmd, parse_deployment_host, remove_schema


def vercel_api_request(*, token: str, url: str) -> Any:
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "webstackbuilders-deploy-to-vercel-action",
    }
    req = urllib.request.Request(url, method="GET", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Vercel API GET {url} failed ({exc.code}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Vercel API GET {url} failed: {exc}") from exc


class VercelClient:
    def __init__(self, ctx: Context) -> None:
        self.ctx = ctx
        self.deployment_host: str | None = None

        # Required by the Vercel CLI for the project.
        os.environ["VERCEL_ORG_ID"] = ctx.vercel_org_id
        os.environ["VERCEL_PROJECT_ID"] = ctx.vercel_project_id

    def deploy(self, commit: dict[str, str] | None) -> str:
        args: list[str] = [f"--token={self.ctx.vercel_token}"]

        if self.ctx.vercel_scope:
            args.append(f"--scope={self.ctx.vercel_scope}")

        if self.ctx.production:
            args.append("--prod")

        # This action is only used from deployment workflows that build on GitHub.
        # Always deploy from the prebuilt Vercel output and skip Vercel's build cache.
        args.append("--prebuilt")
        args.append("--force")

        if commit is not None:
            commit_message = commit.get("commitMessage", "")
            commit_message = commit_message.splitlines()[0] if commit_message else ""

            metadata = [
                f"githubCommitAuthorName={commit.get('authorName', '')}",
                f"githubCommitAuthorLogin={commit.get('authorLogin', '')}",
                f"githubCommitMessage={commit_message}",
                f"githubCommitOrg={self.ctx.user}",
                f"githubCommitRepo={self.ctx.repository}",
                f"githubCommitRef={self.ctx.ref}",
                f"githubCommitSha={self.ctx.sha}",
                f"githubOrg={self.ctx.user}",
                f"githubRepo={self.ctx.repository}",
                "githubDeployment=1",
            ]
            for item in metadata:
                args.extend(["--meta", item])

        log_info("Starting deploy with Vercel CLI")
        output = exec_cmd("vercel", args, self.ctx.working_directory)
        host = parse_deployment_host(output)
        self.deployment_host = host
        return host

    def assign_alias(self, alias_url: str) -> str:
        if not self.deployment_host:
            raise ValueError("No deployment url to alias")

        args = [
            f"--token={self.ctx.vercel_token}",
            "alias",
            "set",
            self.deployment_host,
            remove_schema(alias_url),
        ]
        if self.ctx.vercel_scope:
            args.append(f"--scope={self.ctx.vercel_scope}")
        return exec_cmd("vercel", args, self.ctx.working_directory)

    def get_deployment(self) -> dict[str, Any]:
        if not self.deployment_host:
            raise ValueError("No deployment url")
        url = f"https://api.vercel.com/v11/now/deployments/get?url={urllib.parse.quote(self.deployment_host)}"
        data = vercel_api_request(token=self.ctx.vercel_token, url=url) or {}
        return data
