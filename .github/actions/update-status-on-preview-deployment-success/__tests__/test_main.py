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

    spec = importlib.util.spec_from_file_location("update_status_on_preview_deployment_success", module_path)
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
    for name in ["GITHUB_EVENT_PATH", "GITHUB_ACTOR", "VERCEL_TOKEN", "VERCEL_PROJECT_ID", "VERCEL_ORG_ID"]:
        monkeypatch.delenv(name, raising=False)


def create_temp_event_file(tmp_path: Path, payload: dict[str, Any]) -> str:
    event_path = tmp_path / "event.json"
    event_path.write_text(json.dumps(payload), encoding="utf-8")
    return str(event_path)


def test_detects_vercel_urls() -> None:
    module = load_action_module()
    assert module.is_vercel_url("https://example.vercel.app") is True
    assert module.is_vercel_url("https://example.vercel.com") is True
    assert module.is_vercel_url("https://example.com") is False
    assert module.is_vercel_url(None) is False


def test_builds_a_tagged_preview_comment_body() -> None:
    module = load_action_module()
    body = module.build_preview_comment_body(
        {
            "branch": "feature/my-branch",
            "sha": "0123456789abcdef",
            "owner": "webstackdev",
            "repo": "astro.webstackbuilders.com",
            "previewUrl": "https://example.vercel.app",
            "triggeredBy": "@someone",
        }
    )

    assert module.comment_tag in body
    assert "✅ **Preview deployment ready**" in body
    assert "`feature/my-branch`" in body
    assert "[0123456](" in body
    assert "https://example.vercel.app" in body
    assert "_Triggered by @someone_" in body


def test_creates_a_pr_comment_when_none_exists(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {
                "head_branch": "feature/my-branch",
                "head_sha": "0123456789abcdef",
                "actor": {"login": "kevin", "html_url": "https://github.com/kevin"},
                "pull_requests": [{"number": 123}],
            },
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_ACTOR", "fallback")

    inputs = {"github-token": "ghs_test", "preview-url": "https://example.vercel.app"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    posted: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/issues/123/comments?" in url and method == "GET":
            return MockResponse(ok=True, status_code=200, json_data=[])
        if url.endswith("/issues/123/comments") and method == "POST":
            posted["body"] = (kwargs.get("json") or {}).get("body")
            return MockResponse(ok=True, status_code=201, json_data={"id": 999})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert module.comment_tag in posted["body"]
    assert "https://example.vercel.app" in posted["body"]
    assert "`feature/my-branch`" in posted["body"]
    assert "_Triggered by [@kevin](https://github.com/kevin)_" in posted["body"]


def test_updates_an_existing_tagged_pr_comment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {
                "head_branch": "feature/my-branch",
                "head_sha": "0123456789abcdef",
                "actor": "octocat",
                "pull_requests": [{"number": 123}],
            },
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_ACTOR", "fallback")

    inputs = {"github-token": "ghs_test", "preview-url": "https://example.vercel.app"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    called = {"patch": 0}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/issues/123/comments?" in url and method == "GET":
            return MockResponse(ok=True, status_code=200, json_data=[{"id": 456, "body": f"{module.comment_tag}\nold"}])
        if "/issues/comments/456" in url and method == "PATCH":
            called["patch"] += 1
            return MockResponse(ok=True, status_code=200, json_data={"id": 456})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert called["patch"] == 1


def test_skips_when_workflow_run_payload_has_no_pr_info(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_branch": "feature/my-branch", "head_sha": "0123456789abcdef", "pull_requests": []},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test", "preview-url": "https://example.vercel.app"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    warnings: list[str] = []
    monkeypatch.setattr(module.core, "warning", lambda message: warnings.append(message))

    called = {"requests": 0}

    def fake_request(*args: Any, **kwargs: Any) -> MockResponse:
        called["requests"] += 1
        return MockResponse(ok=True, status_code=200, json_data=[])

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert warnings == ["Missing pull request metadata skipping preview success comment."]
    assert called["requests"] == 0


def test_fails_when_github_comment_create_request_fails(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_branch": "feature/my-branch", "head_sha": "0123456789abcdef", "pull_requests": [{"number": 123}]},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test", "preview-url": "https://example.vercel.app"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/issues/123/comments?" in url and method == "GET":
            return MockResponse(ok=True, status_code=200, json_data=[])
        if url.endswith("/issues/123/comments") and method == "POST":
            return MockResponse(ok=False, status_code=500)
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert failures == ["Unable to create PR comment (status 500)."]
