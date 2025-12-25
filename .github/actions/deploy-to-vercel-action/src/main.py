from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any


def log_info(message: str) -> None:
    print(message)


def log_debug(message: str) -> None:
    print(f"::debug::{message}")


def log_warning(message: str) -> None:
    print(f"::warning::{message}")


def log_error(message: str) -> None:
    print(f"::error::{message}")


def add_mask(value: str) -> None:
    if value.strip():
        print(f"::add-mask::{value}")


def set_output(name: str, value: str) -> None:
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"{name}={value}\n")
        return

    # Fallback for older runners.
    print(f"::set-output name={name}::{value}")


def set_failed(message: str) -> None:
    log_error(message)
    sys.exit(1)


def get_env(name: str, default: str | None = None) -> str:
    value = (os.environ.get(name) or "").strip()
    if value:
        return value
    if default is not None:
        return default
    return ""


def get_input(name: str, default: str | None = None) -> str:
    # Composite actions do not automatically populate INPUT_* unless we do it.
    # Our action.yml maps inputs to INPUT_* environment variables.
    value = get_env(f"INPUT_{name.upper()}")
    if value:
        return value
    if default is not None:
        return default
    return ""


def parse_bool(value: str, default: bool) -> bool:
    trimmed = value.strip()
    if not trimmed:
        return default
    lowered = trimmed.lower()
    if lowered in {"true", "1", "yes", "y", "on"}:
        return True
    if lowered in {"false", "0", "no", "n", "off"}:
        return False
    return default


def parse_disableable_list(value: str, default: list[str] | None) -> list[str] | None:
    trimmed = value.strip()
    if not trimmed:
        return default
    if trimmed.lower() in {"false", "0", "no", "off"}:
        return None
    values = [line.strip() for line in trimmed.splitlines()]
    return [line for line in values if line]


def parse_list(value: str) -> list[str] | None:
    trimmed = value.strip()
    if not trimmed:
        return None
    values = [line.strip() for line in trimmed.splitlines()]
    return [line for line in values if line]


def url_safe_parameter(value: str) -> str:
    return re.sub(r"[^a-z0-9_~]", "-", value, flags=re.IGNORECASE)


def add_schema(url: str) -> str:
    if re.match(r"^https?://", url, flags=re.IGNORECASE):
        return url
    return f"https://{url}"


def remove_schema(url: str) -> str:
    return re.sub(r"^https?://", "", url, flags=re.IGNORECASE)


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


def exec_cmd(command: str, args: list[str], cwd: str | None) -> str:
    cwd_value = cwd.strip() if cwd else ""
    log_debug(f"EXEC: {command} {' '.join(args)} (cwd={cwd_value or '.'})")

    result = subprocess.run(
        [command, *args],
        cwd=cwd_value or None,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=os.environ.copy(),
    )

    if result.stdout:
        for line in result.stdout.splitlines():
            log_debug(line)

    if result.stderr:
        for line in result.stderr.splitlines():
            log_debug(line)

    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout or "").strip() or f"Command failed: {command}")

    return (result.stdout or "").strip()


def parse_deployment_host(cli_output: str) -> str:
    urls = re.findall(r"https?://[^\s]+", cli_output)
    if not urls:
        raise RuntimeError("Could not parse deploymentUrl")

    # Prefer the last URL (usually the Preview URL).
    parsed = urllib.parse.urlparse(urls[-1])
    if not parsed.netloc:
        raise RuntimeError("Could not parse deploymentUrl")
    return parsed.netloc


@dataclass(frozen=True)
class Context:
    github_token: str
    vercel_token: str
    vercel_org_id: str
    vercel_project_id: str
    production: bool
    prebuilt: bool
    github_deployment: bool
    create_comment: bool
    delete_existing_comment: bool
    attach_commit_metadata: bool
    deploy_pr_from_fork: bool
    pr_labels: list[str] | None
    alias_domains: list[str] | None
    pr_preview_domain: str | None
    vercel_scope: str | None
    github_deployment_env: str | None
    trim_commit_message: bool
    build_env: list[str] | None
    working_directory: str | None
    force: bool

    user: str
    repository: str
    branch: str
    pr_number: int | None
    sha: str
    ref: str
    is_pr: bool
    is_fork: bool
    actor: str
    log_url: str


def load_event_payload() -> dict[str, Any]:
    path = get_env("GITHUB_EVENT_PATH")
    if not path:
        return {}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {}


def build_context() -> Context:
    github_repository = get_env("GITHUB_REPOSITORY")
    if "/" not in github_repository:
        raise ValueError("GITHUB_REPOSITORY is not in 'owner/repo' format")
    user, repo = github_repository.split("/", 1)

    event_name = get_env("GITHUB_EVENT_NAME")
    is_pr = event_name in {"pull_request", "pull_request_target"}

    github_token = get_input("GITHUB_TOKEN") or get_input("GH_PAT")
    vercel_token = get_input("VERCEL_TOKEN")
    vercel_org_id = get_input("VERCEL_ORG_ID")
    vercel_project_id = get_input("VERCEL_PROJECT_ID")

    if not github_token:
        raise ValueError("Missing required input: GITHUB_TOKEN")
    if not vercel_token:
        raise ValueError("Missing required input: VERCEL_TOKEN")
    if not vercel_org_id:
        raise ValueError("Missing required input: VERCEL_ORG_ID")
    if not vercel_project_id:
        raise ValueError("Missing required input: VERCEL_PROJECT_ID")

    production = parse_bool(get_input("PRODUCTION"), default=(not is_pr))
    prebuilt = parse_bool(get_input("PREBUILT"), default=False)
    github_deployment = parse_bool(get_input("GITHUB_DEPLOYMENT"), default=True)
    create_comment = parse_bool(get_input("CREATE_COMMENT"), default=True)
    delete_existing_comment = parse_bool(get_input("DELETE_EXISTING_COMMENT"), default=True)
    attach_commit_metadata = parse_bool(get_input("ATTACH_COMMIT_METADATA"), default=True)
    deploy_pr_from_fork = parse_bool(get_input("DEPLOY_PR_FROM_FORK"), default=False)
    trim_commit_message = parse_bool(get_input("TRIM_COMMIT_MESSAGE"), default=False)
    force = parse_bool(get_input("FORCE"), default=False)

    pr_labels = parse_disableable_list(get_input("PR_LABELS"), default=["deployed"])
    alias_domains = parse_disableable_list(get_input("ALIAS_DOMAINS"), default=None)
    pr_preview_domain = (get_input("PR_PREVIEW_DOMAIN") or "").strip() or None
    vercel_scope = (get_input("VERCEL_SCOPE") or "").strip() or None
    github_deployment_env = (get_input("GITHUB_DEPLOYMENT_ENV") or "").strip() or None
    working_directory = (get_input("WORKING_DIRECTORY") or "").strip() or None
    build_env = parse_list(get_input("BUILD_ENV"))

    run_id = get_env("GITHUB_RUN_ID")
    log_url = f"https://github.com/{user}/{repo}/actions/runs/{run_id}" if run_id else f"https://github.com/{user}/{repo}"

    payload = load_event_payload()

    pr_number: int | None = None
    branch = ""
    sha = ""
    ref = ""
    actor = ""
    is_fork = False

    if is_pr:
        pr = (payload or {}).get("pull_request") or {}
        pr_number = int((payload or {}).get("number") or 0) or None
        head = (pr.get("head") or {})
        sha = str(head.get("sha") or "").strip()
        branch = str(head.get("ref") or "").strip()
        ref = branch
        actor = str(((pr.get("user") or {}).get("login") or "")).strip() or user

        head_repo_full_name = str(((head.get("repo") or {}).get("full_name") or "")).strip()
        is_fork = bool(head_repo_full_name and head_repo_full_name != github_repository)
    else:
        actor = get_env("GITHUB_ACTOR") or user
        ref = get_env("GITHUB_REF")
        sha = get_env("GITHUB_SHA")
        # refs/heads/<branch>
        branch = ref[11:] if ref.startswith("refs/heads/") else ref

    if not sha:
        sha = "XXXXXXX"

    return Context(
        github_token=github_token,
        vercel_token=vercel_token,
        vercel_org_id=vercel_org_id,
        vercel_project_id=vercel_project_id,
        production=production,
        prebuilt=prebuilt,
        github_deployment=github_deployment,
        create_comment=create_comment,
        delete_existing_comment=delete_existing_comment,
        attach_commit_metadata=attach_commit_metadata,
        deploy_pr_from_fork=deploy_pr_from_fork,
        pr_labels=pr_labels,
        alias_domains=alias_domains,
        pr_preview_domain=pr_preview_domain,
        vercel_scope=vercel_scope,
        github_deployment_env=github_deployment_env,
        trim_commit_message=trim_commit_message,
        build_env=build_env,
        working_directory=working_directory,
        force=force,
        user=user,
        repository=repo,
        branch=branch,
        pr_number=pr_number,
        sha=sha,
        ref=ref,
        is_pr=is_pr,
        is_fork=is_fork,
        actor=actor,
        log_url=log_url,
    )


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

        api_url = f"{self.base}/repos/{self.ctx.user}/{self.ctx.repository}/deployments/{self.deployment_id}/statuses"
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

        if self.ctx.prebuilt:
            args.append("--prebuilt")

        if self.ctx.force:
            args.append("--force")

        if commit is not None:
            commit_message = commit.get("commitMessage", "")
            if self.ctx.trim_commit_message:
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

        if self.ctx.build_env:
            for item in self.ctx.build_env:
                args.extend(["--build-env", item])

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


def run() -> None:
    try:
        ctx = build_context()
        add_mask(ctx.github_token)
        add_mask(ctx.vercel_token)

        github = GitHubClient(ctx)

        # Refuse to deploy an untrusted fork
        if ctx.is_fork and not ctx.deploy_pr_from_fork:
            log_warning("PR is from fork and DEPLOY_PR_FROM_FORK is set to false")
            body = f"""
                Refusing to deploy this Pull Request to Vercel because it originates from @{ctx.actor}'s fork.

                **@{ctx.user}** To allow this behaviour set `DEPLOY_PR_FROM_FORK` to true.
            """

            comment = github.create_comment(body)
            log_info(f"Comment created: {comment.get('html_url')}")

            set_output("DEPLOYMENT_CREATED", "false")
            set_output("COMMENT_CREATED", "true")
            log_info("Done")
            return

        if ctx.github_deployment:
            log_info("Creating GitHub deployment")
            deployment = github.create_deployment()
            deployment_id = deployment.get("id")
            log_info(f"Deployment #{deployment_id} created")
            github.update_deployment("pending")
            log_info(f"Deployment #{deployment_id} status changed to \"pending\"")

        try:
            log_info("Creating deployment with Vercel CLI")
            log_info("Setting environment variables for Vercel CLI")

            vercel = VercelClient(ctx)
            commit = github.get_commit() if ctx.attach_commit_metadata else None
            deployment_host = vercel.deploy(commit)

            log_info("Successfully deployed to Vercel!")

            deployment_urls: list[str] = []

            if ctx.is_pr and ctx.pr_preview_domain:
                log_info("Assigning custom preview domain to PR")
                alias_template = ctx.pr_preview_domain
                alias = (
                    alias_template.replace("{USER}", url_safe_parameter(ctx.user))
                    .replace("{REPO}", url_safe_parameter(ctx.repository))
                    .replace("{BRANCH}", url_safe_parameter(ctx.branch))
                    .replace("{PR}", str(ctx.pr_number or ""))
                    .replace("{SHA}", ctx.sha[:7])
                    .lower()
                )

                preview_suffix = ".vercel.app"
                next_alias = alias

                if alias.endswith(preview_suffix):
                    prefix = alias[: alias.index(preview_suffix)]
                    if len(prefix) >= 60:
                        log_warning(
                            f"The alias {prefix} exceeds 60 chars in length, truncating using vercel's rules."
                        )
                        truncated = prefix[:55]
                        unique_suffix = hashlib.sha256(f"git-{ctx.branch}-{ctx.repository}".encode("utf-8")).hexdigest()[:6]
                        next_alias = f"{truncated}-{unique_suffix}{preview_suffix}"
                        log_info(f"Updated domain alias: {next_alias}")

                vercel.assign_alias(next_alias)
                deployment_urls.append(add_schema(next_alias))

            if (not ctx.is_pr) and ctx.alias_domains:
                log_info("Assigning custom domains to Vercel deployment")

                for domain in ctx.alias_domains:
                    alias = (
                        domain.replace("{USER}", url_safe_parameter(ctx.user))
                        .replace("{REPO}", url_safe_parameter(ctx.repository))
                        .replace("{BRANCH}", url_safe_parameter(ctx.branch))
                        .replace("{SHA}", ctx.sha[:7])
                        .lower()
                    )

                    vercel.assign_alias(alias)
                    deployment_urls.append(add_schema(alias))

            deployment_urls.append(add_schema(deployment_host))
            preview_url = deployment_urls[0]

            deployment = vercel.get_deployment()
            deployment_id = str(deployment.get("id") or "").strip()
            inspector_url = str(deployment.get("inspectorUrl") or "").strip()

            log_info(f"Deployment \"{deployment_id}\" available at: {', '.join(deployment_urls)}")

            if ctx.github_deployment:
                log_info('Changing GitHub deployment status to "success"')
                github.update_deployment("success", preview_url)

            if ctx.is_pr:
                if ctx.delete_existing_comment:
                    log_info("Checking for existing comment on PR")
                    deleted_comment_id = github.delete_existing_comment()
                    if deleted_comment_id:
                        log_info(f"Deleted existing comment #{deleted_comment_id}")

                if ctx.create_comment:
                    log_info("Creating new comment on PR")
                    body = f"""
                        This pull request has been deployed to Vercel.

                        <table>
                          <tr>
                            <td><strong>Latest commit:</strong></td>
                            <td><code>{ctx.sha[:7]}</code></td>
                          </tr>
                          <tr>
                            <td><strong>✅ Preview:</strong></td>
                            <td><a href='{preview_url}'>{preview_url}</a></td>
                          </tr>
                          <tr>
                            <td><strong>🔍 Inspect:</strong></td>
                            <td><a href='{inspector_url}'>{inspector_url}</a></td>
                          </tr>
                        </table>

                        [View Workflow Logs]({ctx.log_url})
                    """

                    comment = github.create_comment(body)
                    log_info(f"Comment created: {comment.get('html_url')}")

                if ctx.pr_labels:
                    log_info("Adding label(s) to PR")
                    labels = github.add_labels(ctx.pr_labels)
                    names = [str((label or {}).get("name") or "").strip() for label in labels]
                    names = [name for name in names if name]
                    log_info(f"Label(s) \"{', '.join(names)}\" added")

            set_output("PREVIEW_URL", preview_url)
            set_output("DEPLOYMENT_URLS", json.dumps(deployment_urls))
            set_output("DEPLOYMENT_UNIQUE_URL", deployment_urls[-1])
            if deployment_id:
                set_output("DEPLOYMENT_ID", deployment_id)
            if inspector_url:
                set_output("DEPLOYMENT_INSPECTOR_URL", inspector_url)
            set_output("DEPLOYMENT_CREATED", "true")
            set_output("COMMENT_CREATED", "true" if (ctx.is_pr and ctx.create_comment) else "false")

            log_info("Done")
        except Exception as exc:
            # Mirror JS behavior: mark deployment as failure if possible.
            try:
                github.update_deployment("failure")
            except Exception:
                pass
            raise exc
    except Exception as exc:
        set_failed(str(exc))


if __name__ == "__main__":
    run()
