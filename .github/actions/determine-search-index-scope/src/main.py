from __future__ import annotations

import os
from typing import Any, Final

import requests
from actions_toolkit import core

GITHUB_API_BASE: Final[str] = "https://api.github.com"


def get_required_env(name: str) -> str:
    value = (os.environ.get(name) or "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_input(name: str, default: str | None = None) -> str:
    env_name = f"INPUT_{name.upper()}"
    value = (os.environ.get(env_name) or "").strip()
    if value:
        return value
    if default is None:
        raise ValueError(f"Missing required input: {name}")
    return default


def parse_github_repo() -> tuple[str, str]:
    repo = get_required_env("GITHUB_REPOSITORY")
    if "/" not in repo:
        raise ValueError("GITHUB_REPOSITORY is not in 'owner/repo' format.")
    owner, name = repo.split("/", 1)
    return owner, name


def github_get_json(
    *,
    token: str,
    path: str,
    params: dict[str, Any] | None = None,
) -> Any:
    url = f"{GITHUB_API_BASE}{path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)
    if response.status_code < 200 or response.status_code >= 300:
        raise ValueError(f"GitHub API request failed ({response.status_code}) for {path}: {response.text}")
    return response.json()


def find_previous_successful_run_sha(
    *,
    token: str,
    owner: str,
    repo: str,
    workflow_file: str,
    base_branch: str,
    current_run_id: str,
) -> str | None:
    data = github_get_json(
        token=token,
        path=f"/repos/{owner}/{repo}/actions/workflows/{workflow_file}/runs",
        params={
            "branch": base_branch,
            "status": "completed",
            "per_page": 10,
        },
    )

    runs = (data or {}).get("workflow_runs") or []
    for workflow_run in runs:
        run_id = str((workflow_run or {}).get("id") or "").strip()
        if run_id and run_id == current_run_id:
            continue
        if (workflow_run or {}).get("conclusion") != "success":
            continue
        head_sha = str((workflow_run or {}).get("head_sha") or "").strip()
        if head_sha:
            return head_sha

    return None


def determine_crawl_scope(*, changed_files: list[str], content_root: str) -> tuple[bool, bool, bool, bool]:
    normalized_root = content_root
    if not normalized_root.endswith("/"):
        normalized_root = f"{normalized_root}/"

    content_files = [file for file in changed_files if file.startswith(normalized_root)]
    should_index = len(content_files) > 0

    if not should_index:
        return False, False, False, False

    articles_prefix = f"{normalized_root}articles/"
    services_prefix = f"{normalized_root}services/"
    case_studies_prefix = f"{normalized_root}case-studies/"

    articles_changed = any(file.startswith(articles_prefix) for file in content_files)
    services_changed = any(file.startswith(services_prefix) for file in content_files)
    case_studies_changed = any(file.startswith(case_studies_prefix) for file in content_files)

    other_content_changed = any(
        not file.startswith(articles_prefix)
        and not file.startswith(services_prefix)
        and not file.startswith(case_studies_prefix)
        for file in content_files
    )

    only_articles_changed = articles_changed and not services_changed and not case_studies_changed and not other_content_changed

    if only_articles_changed:
        return True, True, False, False

    if other_content_changed:
        return True, True, True, True

    return True, articles_changed, services_changed, case_studies_changed


def run() -> None:
    try:
        token = get_input("token")
        workflow_file = get_input("workflow_file", "deployment-production.yml")
        base_branch = get_input("base_branch", "main")
        current_run_id = get_input("current_run_id")
        head_sha = get_input("head_sha")
        content_root = get_input("content_root", "src/content/")

        owner, repo = parse_github_repo()

        base_sha = find_previous_successful_run_sha(
            token=token,
            owner=owner,
            repo=repo,
            workflow_file=workflow_file,
            base_branch=base_branch,
            current_run_id=current_run_id,
        )

        # If we cannot determine the previous deployed SHA, index everything.
        if not base_sha:
            core.set_output("should_index", "true")
            core.set_output("crawl_articles", "true")
            core.set_output("crawl_services", "true")
            core.set_output("crawl_case_studies", "true")
            core.info("No previous successful deploy run found; indexing all sections.")
            return

        compare = github_get_json(
            token=token,
            path=f"/repos/{owner}/{repo}/compare/{base_sha}...{head_sha}",
        )

        changed_files = [str(file.get("filename")) for file in (compare or {}).get("files") or [] if file.get("filename")]

        should_index, crawl_articles, crawl_services, crawl_case_studies = determine_crawl_scope(
            changed_files=changed_files,
            content_root=content_root,
        )

        core.set_output("should_index", "true" if should_index else "false")
        core.set_output("crawl_articles", "true" if crawl_articles else "false")
        core.set_output("crawl_services", "true" if crawl_services else "false")
        core.set_output("crawl_case_studies", "true" if crawl_case_studies else "false")

        core.info(f"Comparing {base_sha}...{head_sha}")
        core.info(
            " ".join(
                [
                    f"should_index={should_index}",
                    f"crawl_articles={crawl_articles}",
                    f"crawl_services={crawl_services}",
                    f"crawl_case_studies={crawl_case_studies}",
                ]
            )
        )
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
