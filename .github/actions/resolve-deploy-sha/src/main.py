from __future__ import annotations

import json
import os
from typing import Any

from actions_toolkit import core


def get_required_env(name: str) -> str:
    value = (os.environ.get(name) or "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def read_event_payload() -> Any:
    path = get_required_env("GITHUB_EVENT_PATH")
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def resolve_from_workflow_run(payload: Any) -> tuple[str, str, str, str]:
    workflow_run = (payload or {}).get("workflow_run") or {}
    sha = (workflow_run.get("head_sha") or "").strip()
    trigger_event = (workflow_run.get("event") or "").strip()
    head_branch = (workflow_run.get("head_branch") or "").strip()

    prs = workflow_run.get("pull_requests") or []
    is_fork = False
    if prs:
        pr = prs[0] or {}
        is_fork = bool((((pr.get("head") or {}).get("repo") or {}).get("fork")))

    if not sha:
        raise ValueError("Missing workflow_run.head_sha in event payload.")

    return sha, trigger_event, head_branch, "true" if is_fork else "false"


def resolve_from_environment() -> tuple[str, str, str, str]:
    sha = get_required_env("GITHUB_SHA")
    trigger_event = (os.environ.get("GITHUB_EVENT_NAME") or "").strip()
    head_branch = (os.environ.get("GITHUB_REF_NAME") or "").strip()
    return sha, trigger_event, head_branch, "false"


def run() -> None:
    try:
        event_name = (os.environ.get("GITHUB_EVENT_NAME") or "").strip()
        payload = read_event_payload()

        if event_name == "workflow_run":
            sha, trigger_event, head_branch, is_fork = resolve_from_workflow_run(payload)
        else:
            sha, trigger_event, head_branch, is_fork = resolve_from_environment()

        core.set_output("sha", sha)
        core.set_output("trigger_event", trigger_event)
        core.set_output("head_branch", head_branch)
        core.set_output("is_fork", is_fork)
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
