from __future__ import annotations

import hashlib
import os
import sys
from dataclasses import dataclass

# pylint: disable=wrong-import-position

# Ensure sibling modules (e.g. utils.py) can be imported when this file is loaded directly.
src_dir = os.path.dirname(__file__)
sys.path.insert(0, src_dir)

from utils import add_schema, url_safe_parameter


@dataclass(frozen=True)
class DeploymentUrlsResult:
    deployment_urls: list[str]
    preview_url: str
    aliases_to_assign: list[str]
    truncated_preview_alias_from: str | None
    truncated_preview_alias_to: str | None


def compute_pr_preview_alias(
    *,
    pr_preview_domain: str,
    user: str,
    repository: str,
    branch: str,
    pr_number: int | None,
    sha: str,
) -> tuple[str, str | None, str | None]:
    alias_template = pr_preview_domain
    alias = (
        alias_template.replace("{USER}", url_safe_parameter(user))
        .replace("{REPO}", url_safe_parameter(repository))
        .replace("{BRANCH}", url_safe_parameter(branch))
        .replace("{PR}", str(pr_number or ""))
        .replace("{SHA}", sha[:7])
        .lower()
    )

    preview_suffix = ".vercel.app"
    next_alias = alias
    truncated_from: str | None = None
    truncated_to: str | None = None

    if alias.endswith(preview_suffix):
        prefix = alias[: alias.index(preview_suffix)]
        if len(prefix) >= 60:
            truncated_from = prefix
            truncated = prefix[:55]
            unique_suffix = hashlib.sha256(f"git-{branch}-{repository}".encode("utf-8")).hexdigest()[:6]
            next_alias = f"{truncated}-{unique_suffix}{preview_suffix}"
            truncated_to = next_alias

    return next_alias, truncated_from, truncated_to


def compute_alias_domain(
    *,
    alias_domain: str,
    user: str,
    repository: str,
    branch: str,
    sha: str,
) -> str:
    return (
        alias_domain.replace("{USER}", url_safe_parameter(user))
        .replace("{REPO}", url_safe_parameter(repository))
        .replace("{BRANCH}", url_safe_parameter(branch))
        .replace("{SHA}", sha[:7])
        .lower()
    )


def build_deployment_urls(
    *,
    is_pr: bool,
    pr_preview_domain: str | None,
    alias_domains: list[str] | None,
    deployment_host: str,
    user: str,
    repository: str,
    branch: str,
    pr_number: int | None,
    sha: str,
) -> DeploymentUrlsResult:
    deployment_urls: list[str] = []
    aliases_to_assign: list[str] = []
    truncated_from: str | None = None
    truncated_to: str | None = None

    if is_pr and pr_preview_domain:
        next_alias, truncated_from, truncated_to = compute_pr_preview_alias(
            pr_preview_domain=pr_preview_domain,
            user=user,
            repository=repository,
            branch=branch,
            pr_number=pr_number,
            sha=sha,
        )
        aliases_to_assign.append(next_alias)
        deployment_urls.append(add_schema(next_alias))

    if (not is_pr) and alias_domains:
        for domain in alias_domains:
            alias = compute_alias_domain(
                alias_domain=domain,
                user=user,
                repository=repository,
                branch=branch,
                sha=sha,
            )
            aliases_to_assign.append(alias)
            deployment_urls.append(add_schema(alias))

    deployment_urls.append(add_schema(deployment_host))
    preview_url = deployment_urls[0]

    return DeploymentUrlsResult(
        deployment_urls=deployment_urls,
        preview_url=preview_url,
        aliases_to_assign=aliases_to_assign,
        truncated_preview_alias_from=truncated_from,
        truncated_preview_alias_to=truncated_to,
    )
