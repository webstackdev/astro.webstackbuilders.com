from __future__ import annotations

import os
from typing import Any, Final, Iterable

import requests
from actions_toolkit import core
from upstash_search import Search

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


def normalize_origin(origin: str) -> str:
    trimmed = origin.strip()
    if not trimmed:
        raise ValueError("site_origin is empty")
    return trimmed[:-1] if trimmed.endswith("/") else trimmed


def normalize_content_root(content_root: str) -> str:
    trimmed = content_root.strip()
    if not trimmed:
        raise ValueError("content_root is empty")
    return trimmed if trimmed.endswith("/") else f"{trimmed}/"


def content_file_to_url_path(*, filename: str, content_root: str, collection: str) -> str | None:
    normalized_root = normalize_content_root(content_root)

    if not filename.startswith(normalized_root):
        return None

    relative = filename[len(normalized_root) :]
    expected_prefix = f"{collection}/"
    if not relative.startswith(expected_prefix):
        return None

    relative = relative[len(expected_prefix) :]

    # Strip extension
    if relative.endswith(".mdx"):
        relative = relative[: -len(".mdx")]
    elif relative.endswith(".md"):
        relative = relative[: -len(".md")]
    else:
        return None

    # Drop trailing /index
    if relative.endswith("/index"):
        relative = relative[: -len("/index")]
    elif relative == "index":
        relative = ""

    relative = relative.strip("/")

    if relative:
        return f"/{collection}/{relative}"
    return f"/{collection}"


def chunked(values: list[str], chunk_size: int) -> Iterable[list[str]]:
    for index in range(0, len(values), chunk_size):
        yield values[index : index + chunk_size]


def run() -> None:
    try:
        github_token = get_input("github_token")
        workflow_file = get_input("workflow_file", "deployment-production.yml")
        base_branch = get_input("base_branch", "main")
        current_run_id = get_input("current_run_id")
        head_sha = get_input("head_sha")

        upstash_url = get_input("upstash_url")
        upstash_token = get_input("upstash_token")
        index_name = get_input("index_name", "default")

        site_origin = normalize_origin(get_input("site_origin"))
        collection = get_input("collection")
        content_root = get_input("content_root", "src/content/")

        if collection not in {"articles", "services", "case-studies"}:
            raise ValueError("collection must be one of: articles, services, case-studies")

        owner, repo = parse_github_repo()

        base_sha = find_previous_successful_run_sha(
            token=github_token,
            owner=owner,
            repo=repo,
            workflow_file=workflow_file,
            base_branch=base_branch,
            current_run_id=current_run_id,
        )

        # If we can't determine the previous deployed SHA, don't delete anything.
        if not base_sha:
            core.set_output("deleted_count", "0")
            core.info("No previous successful deploy run found; skipping prune.")
            return

        compare = github_get_json(
            token=github_token,
            path=f"/repos/{owner}/{repo}/compare/{base_sha}...{head_sha}",
        )

        removed_files: list[str] = []
        for file in (compare or {}).get("files") or []:
            filename = str((file or {}).get("filename") or "").strip()
            status = str((file or {}).get("status") or "").strip()
            if not filename or status != "removed":
                continue
            removed_files.append(filename)

        removed_doc_ids: list[str] = []
        for filename in removed_files:
            url_path = content_file_to_url_path(filename=filename, content_root=content_root, collection=collection)
            if not url_path:
                continue
            removed_doc_ids.append(f"{site_origin}{url_path}")

        if not removed_doc_ids:
            core.set_output("deleted_count", "0")
            core.info("No removed documents to prune.")
            return

        core.info(f"Found {len(removed_doc_ids)} removed URLs to delete from Upstash Search.")

        client = Search(url=upstash_url, token=upstash_token)
        index = client.index(index_name)

        deleted_total = 0
        for chunk in chunked(removed_doc_ids, 100):
            deleted_total += int(index.delete(ids=chunk))

        core.set_output("deleted_count", str(deleted_total))
        core.info(f"Deleted {deleted_total} documents from index '{index_name}'.")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
