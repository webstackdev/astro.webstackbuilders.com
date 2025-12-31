from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

# pylint: disable=too-many-instance-attributes,too-many-statements

from inputs import get_env, get_input, parse_bool, parse_disableable_list


@dataclass(frozen=True)
class Context:
    github_token: str
    vercel_token: str
    vercel_org_id: str
    vercel_project_id: str
    production: bool
    public_google_maps_api_key: str
    public_google_map_id: str
    public_sentry_dsn: str
    public_upstash_search_rest_url: str
    public_upstash_search_readonly_token: str
    pr_labels: list[str] | None
    alias_domains: list[str] | None
    pr_preview_domain: str | None
    vercel_scope: str | None
    github_deployment_env: str | None
    working_directory: str | None

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


def _parse_repository_slug(github_repository: str) -> tuple[str, str]:
    if "/" not in github_repository:
        raise ValueError("GITHUB_REPOSITORY is not in 'owner/repo' format")
    user, repo = github_repository.split("/", 1)
    return user, repo


def _require_input(name: str) -> str:
    value = get_input(name)
    if not value:
        raise ValueError(f"Missing required input: {name}")
    return value


def _require_one_of_inputs(primary: str, fallback: str, *, display_name: str) -> str:
    value = get_input(primary) or get_input(fallback)
    if not value:
        raise ValueError(f"Missing required input: {display_name}")
    return value


def _extract_pr_context(
    *,
    payload: dict[str, Any],
    github_repository: str,
    default_user: str,
) -> tuple[str, str, str, str, int | None, bool]:
    pr = (payload or {}).get("pull_request") or {}

    pr_number = int((payload or {}).get("number") or 0) or None

    head = (pr.get("head") or {})
    sha = str(head.get("sha") or "").strip() or "XXXXXXX"
    branch = str(head.get("ref") or "").strip()
    ref = branch
    actor = str(((pr.get("user") or {}).get("login") or "")).strip() or default_user

    head_repo_full_name = str(((head.get("repo") or {}).get("full_name") or "")).strip()
    is_fork = bool(head_repo_full_name and head_repo_full_name != github_repository)

    return branch, sha, ref, actor, pr_number, is_fork


def _extract_push_context(*, default_user: str) -> tuple[str, str, str, str, int | None, bool]:
    actor = get_env("GITHUB_ACTOR") or default_user
    ref = get_env("GITHUB_REF")
    sha = get_env("GITHUB_SHA") or "XXXXXXX"

    # refs/heads/<branch>
    branch = ref[11:] if ref.startswith("refs/heads/") else ref

    return branch, sha, ref, actor, None, False


def build_context() -> Context:
    github_repository = get_env("GITHUB_REPOSITORY")
    user, repo = _parse_repository_slug(github_repository)

    event_name = get_env("GITHUB_EVENT_NAME")
    is_pr = event_name in {"pull_request", "pull_request_target"}

    github_token = _require_one_of_inputs("GITHUB_TOKEN", "GH_PAT", display_name="GITHUB_TOKEN")
    vercel_token = _require_input("VERCEL_TOKEN")
    vercel_org_id = _require_input("VERCEL_ORG_ID")
    vercel_project_id = _require_input("VERCEL_PROJECT_ID")

    production = parse_bool(get_input("PRODUCTION"), default=not is_pr)

    public_google_maps_api_key = _require_input("PUBLIC_GOOGLE_MAPS_API_KEY")
    public_google_map_id = _require_input("PUBLIC_GOOGLE_MAP_ID")
    public_sentry_dsn = _require_input("PUBLIC_SENTRY_DSN")
    public_upstash_search_rest_url = _require_input("PUBLIC_UPSTASH_SEARCH_REST_URL")
    public_upstash_search_readonly_token = _require_input("PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN")

    pr_labels = parse_disableable_list(get_input("PR_LABELS"), default=["deployed"])
    alias_domains = parse_disableable_list(get_input("ALIAS_DOMAINS"), default=None)
    pr_preview_domain = (get_input("PR_PREVIEW_DOMAIN") or "").strip() or None
    vercel_scope = (get_input("VERCEL_SCOPE") or "").strip() or None
    github_deployment_env = (get_input("GITHUB_DEPLOYMENT_ENV") or "").strip() or None
    working_directory = (get_input("WORKING_DIRECTORY") or "").strip() or None

    run_id = get_env("GITHUB_RUN_ID")
    log_url = f"https://github.com/{user}/{repo}/actions/runs/{run_id}" if run_id else f"https://github.com/{user}/{repo}"

    payload = load_event_payload()
    if is_pr:
        branch, sha, ref, actor, pr_number, is_fork = _extract_pr_context(
            payload=payload,
            github_repository=github_repository,
            default_user=user,
        )
    else:
        branch, sha, ref, actor, pr_number, is_fork = _extract_push_context(default_user=user)

    return Context(
        github_token=github_token,
        vercel_token=vercel_token,
        vercel_org_id=vercel_org_id,
        vercel_project_id=vercel_project_id,
        production=production,
        public_google_maps_api_key=public_google_maps_api_key,
        public_google_map_id=public_google_map_id,
        public_sentry_dsn=public_sentry_dsn,
        public_upstash_search_rest_url=public_upstash_search_rest_url,
        public_upstash_search_readonly_token=public_upstash_search_readonly_token,
        pr_labels=pr_labels,
        alias_domains=alias_domains,
        pr_preview_domain=pr_preview_domain,
        vercel_scope=vercel_scope,
        github_deployment_env=github_deployment_env,
        working_directory=working_directory,
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
