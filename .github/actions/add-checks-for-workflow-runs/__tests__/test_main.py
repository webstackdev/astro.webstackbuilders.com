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

    spec = importlib.util.spec_from_file_location("add_checks_for_workflow_runs", module_path)
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
    for name in ["GITHUB_EVENT_PATH", "GITHUB_RUN_ID", "VERIFY_RESULT", "DEPLOY_RESULT", "PREVIEW_URL"]:
        monkeypatch.delenv(name, raising=False)


def create_temp_event_file(tmp_path: Path, payload: dict[str, Any]) -> str:
    event_path = tmp_path / "event.json"
    event_path.write_text(json.dumps(payload), encoding="utf-8")
    return str(event_path)


def test_skips_when_head_sha_missing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_branch": "feature/thing"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_RUN_ID", "999")

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

    assert warnings == ["Missing workflow_run.head_sha; cannot publish check run."]
    assert called["requests"] == 0
    assert failures == []


def test_creates_check_run_when_none_exists(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef", "head_branch": "feature/thing"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_RUN_ID", "999")

    inputs = {
        "github-token": "ghs_test",
        "verify-result": "success",
        "deploy-result": "success",
        "preview-url": "https://example.vercel.app",
    }
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    captured: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/check-runs?filter=latest" in url:
            return MockResponse(ok=True, status_code=200, json_data={"check_runs": []})
        if url.endswith("/check-runs") and method == "POST":
            captured["create_body"] = kwargs.get("json")
            return MockResponse(ok=True, status_code=201, json_data={"id": 1})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    body = captured.get("create_body")
    assert body
    assert "Preview deployed: https://example.vercel.app" in body["output"]["summary"]
    assert "actions/runs/999" in body["details_url"]


def test_updates_existing_check_run_when_present(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef", "head_branch": "feature/thing"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_RUN_ID", "999")

    inputs = {
        "github-token": "ghs_test",
        "verify-result": "success",
        "deploy-result": "failure",
        "preview-url": "",
    }
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    captured: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/check-runs?filter=latest" in url:
            return MockResponse(ok=True, status_code=200, json_data={"check_runs": [{"id": 456, "name": module.CHECK_NAME}]})
        if "/check-runs/456" in url and method == "PATCH":
            captured["patch_body"] = kwargs.get("json")
            return MockResponse(ok=True, status_code=200, json_data={"id": 456})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    body = captured.get("patch_body")
    assert body
    assert body["conclusion"] == "failure"
    assert "Preview deployment failed (failure)." in body["output"]["summary"]


def test_marks_hotfix_branch_as_success_regardless_of_results(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"head_sha": "0123456789abcdef", "head_branch": "hotfix/something"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_RUN_ID", "999")

    inputs = {
        "github-token": "ghs_test",
        "verify-result": "failure",
        "deploy-result": "failure",
        "preview-url": "",
    }
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    captured: dict[str, Any] = {}

    def fake_request(method: str, url: str, **kwargs: Any) -> MockResponse:
        if "/check-runs?filter=latest" in url:
            return MockResponse(ok=True, status_code=200, json_data={"check_runs": []})
        if url.endswith("/check-runs") and method == "POST":
            captured["create_body"] = kwargs.get("json")
            return MockResponse(ok=True, status_code=201, json_data={"id": 1})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "request", fake_request)

    module.run()

    body = captured.get("create_body")
    assert body
    assert body["conclusion"] == "success"
    assert "Hotfix branch: preview deploy intentionally skipped." in body["output"]["summary"]
