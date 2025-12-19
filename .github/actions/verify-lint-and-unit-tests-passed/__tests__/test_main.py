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

    spec = importlib.util.spec_from_file_location("verify_lint_and_unit_tests_passed", module_path)
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


def test_skips_verification_for_hotfix_pull_request_workflow_run(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"id": 123, "head_branch": "hotfix/something", "event": "pull_request"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test"}
    notices: list[str] = []
    failures: list[str] = []

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))
    monkeypatch.setattr(module.core, "notice", lambda message: notices.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    called = {"requests": 0}

    def fake_get(*args: Any, **kwargs: Any) -> MockResponse:
        called["requests"] += 1
        return MockResponse(ok=True, status_code=200, json_data={})

    monkeypatch.setattr(module.requests, "get", fake_get)

    module.run()

    assert notices == ["Hotfix branch: skipping CI verification requirements."]
    assert called["requests"] == 0
    assert failures == []


def test_fails_when_required_jobs_missing_or_not_successful(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"id": 123, "head_branch": "feature/thing", "event": "pull_request"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test"}
    failures: list[str] = []

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    def fake_get(url: str, **kwargs: Any) -> MockResponse:
        if "/actions/runs/123/jobs" in url:
            return MockResponse(ok=True, status_code=200, json_data={"jobs": [{"name": "Lint", "conclusion": "success"}]})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "get", fake_get)

    module.run()

    assert failures == ["Required CI jobs missing or failed: Unit Tests"]


def test_passes_when_required_jobs_succeeded(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {"id": 123, "head_branch": "feature/thing", "event": "pull_request"},
            "repository": {"owner": {"login": "webstackdev"}, "name": "astro.webstackbuilders.com"},
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    inputs = {"github-token": "ghs_test"}
    failures: list[str] = []
    infos: list[str] = []

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))
    monkeypatch.setattr(module.core, "info", lambda message: infos.append(message))

    def fake_get(url: str, **kwargs: Any) -> MockResponse:
        if "/actions/runs/123/jobs" in url:
            return MockResponse(
                ok=True,
                status_code=200,
                json_data={
                    "jobs": [
                        {"name": "Lint", "conclusion": "success"},
                        {"name": "Unit Tests", "conclusion": "success"},
                    ]
                },
            )
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "get", fake_get)

    module.run()

    assert failures == []
    assert infos == ["Required CI jobs succeeded."]
