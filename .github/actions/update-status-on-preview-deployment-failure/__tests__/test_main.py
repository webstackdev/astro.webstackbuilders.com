from __future__ import annotations

import json
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("update_status_on_preview_deployment_failure", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class MockResponse:
    def __init__(self, *, ok: bool, status_code: int, json_data: Any | None = None):
        self.ok = ok
        self.status_code = status_code
        self._json_data = json_data

    def json(self) -> Any:
        return self._json_data


@pytest.fixture(autouse=True)
def clear_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ["GITHUB_EVENT_PATH", "GITHUB_RUN_ID", "VERCEL_TOKEN", "VERCEL_PROJECT_ID", "VERCEL_ORG_ID"]:
        monkeypatch.delenv(name, raising=False)


def create_temp_event_file(tmp_path: Path, payload: dict[str, Any]) -> str:
    event_path = tmp_path / "event.json"
    event_path.write_text(json.dumps(payload), encoding="utf-8")
    return str(event_path)


def test_builds_failure_comment_body_with_correct_link_text() -> None:
    module = load_action_module()

    a = module.build_failure_comment_body(target_url="https://example.com", is_fallback_run_url=True)
    assert "❌ Preview deployment failed." in a
    assert "View the workflow logs" in a

    b = module.build_failure_comment_body(target_url="https://example.vercel.app", is_fallback_run_url=False)
    assert "Open the failed Vercel deployment" in b


def test_skips_when_no_pr_metadata_exists(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef", "pull_requests": []},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test", "preview-url": ""}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    warnings: list[str] = []
    failures: list[str] = []

    monkeypatch.setattr(module.core, "warning", lambda message: warnings.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    called = {"requests": 0}

    def fake_request(*args: Any, **kwargs: Any) -> MockResponse:
        called["requests"] += 1
        return MockResponse(ok=True, status_code=200, json_data=[])

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert warnings == ["No pull request metadata available; skipping preview failure comment."]
    assert called["requests"] == 0
    assert failures == []


def test_creates_a_pr_comment_using_preview_url_when_provided(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef", "pull_requests": [{"number": 123}]},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_RUN_ID", "999")

    inputs = {"github-token": "ghs_test", "preview-url": "https://example.vercel.app"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    posted: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if url.endswith("/issues/123/comments") and method == "POST":
            posted["body"] = (kwargs.get("json") or {}).get("body")
            return MockResponse(ok=True, status_code=201, json_data={"id": 1})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert "Open the failed Vercel deployment" in posted["body"]
    assert "https://example.vercel.app" in posted["body"]


def test_falls_back_to_github_run_url_when_preview_url_cannot_be_resolved(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef", "pull_requests": [{"number": 123}]},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_RUN_ID", "999")

    inputs = {"github-token": "ghs_test", "preview-url": ""}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    posted: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if url.endswith("/issues/123/comments") and method == "POST":
            posted["body"] = (kwargs.get("json") or {}).get("body")
            return MockResponse(ok=True, status_code=201, json_data={"id": 1})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert "View the workflow logs" in posted["body"]
    assert "actions/runs/999" in posted["body"]
