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

    spec = importlib.util.spec_from_file_location("update_status_on_production_deployment_failure", module_path)
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
    monkeypatch.delenv("GITHUB_EVENT_PATH", raising=False)


def create_temp_event_file(tmp_path: Path, payload: dict[str, Any]) -> str:
    event_path = tmp_path / "event.json"
    event_path.write_text(json.dumps(payload), encoding="utf-8")
    return str(event_path)


def test_skips_when_head_sha_missing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {"workflow_run": {}, "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"}},
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "ghs_test" if name == "github-token" else "")

    warnings: list[str] = []
    failures: list[str] = []
    monkeypatch.setattr(module.core, "warning", lambda message: warnings.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    called = {"requests": 0}

    def fake_request(*args: Any, **kwargs: Any) -> MockResponse:
        called["requests"] += 1
        return MockResponse(ok=True, status_code=200, json_data={})

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert warnings == ["Missing workflow_run.head_sha; skipping production failure comment."]
    assert called["requests"] == 0
    assert failures == []


def test_creates_commit_comment_with_production_url_when_provided(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test", "preview-url": "https://example.vercel.app"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    captured: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/commits/0123456789abcdef/comments" in url and method == "POST":
            captured["body"] = (kwargs.get("json") or {}).get("body")
            return MockResponse(ok=True, status_code=201, json_data={"id": 1})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert "❌ Production deployment failed." in captured["body"]
    assert "🔗 https://example.vercel.app" in captured["body"]


def test_creates_commit_comment_without_url_when_none_provided(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "ghs_test" if name == "github-token" else "")

    captured: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/commits/0123456789abcdef/comments" in url and method == "POST":
            captured["body"] = (kwargs.get("json") or {}).get("body")
            return MockResponse(ok=True, status_code=201, json_data={"id": 1})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    assert captured["body"] == "❌ Production deployment failed. Please review the Vercel logs."
