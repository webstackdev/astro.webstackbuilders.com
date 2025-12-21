from __future__ import annotations

from pathlib import Path
from types import ModuleType
from typing import Any

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("check_prereqs", module_path)
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


def test_sets_should_deploy_false_when_missing_required_runs(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    inputs = {
        "github-token": "ghs_test",
        "sha": "abc",
        "required-workflows-json": '[{"id":"lint.yml","label":"Lint"}]',
        "build-workflow-file": "build-preview.yml",
        "artifact-name": "vercel-build-preview",
        "skip-hotfix": "false",
        "skip-forks": "false",
    }

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_API_URL", "https://api.github.com")

    outputs: dict[str, str] = {}
    notices: list[str] = []
    failures: list[str] = []

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "notice", lambda m: notices.append(m))
    monkeypatch.setattr(module.core, "set_failed", lambda m: failures.append(m))

    def fake_get(url: str, **kwargs: Any) -> MockResponse:
        if "/actions/workflows/lint.yml/runs" in url:
            return MockResponse(ok=True, status_code=200, json_data={"workflow_runs": []})
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "get", fake_get)

    module.run()

    assert failures == []
    assert outputs["should_deploy"] == "false"
    assert any("prerequisites not met" in n for n in notices)


def test_outputs_artifact_download_url_when_all_prereqs_succeed(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    inputs = {
        "github-token": "ghs_test",
        "sha": "abc",
        "required-workflows-json": '[{"id":"build-preview.yml","label":"Build Preview"}]',
        "build-workflow-file": "build-preview.yml",
        "artifact-name": "vercel-build-preview",
        "skip-hotfix": "false",
        "skip-forks": "false",
    }

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_API_URL", "https://api.github.com")

    outputs: dict[str, str] = {}
    failures: list[str] = []

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: failures.append(m))

    def fake_get(url: str, **kwargs: Any) -> MockResponse:
        if "/actions/workflows/build-preview.yml/runs" in url:
            return MockResponse(ok=True, status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "success"}]})
        if "/actions/runs/123/artifacts" in url:
            return MockResponse(
                ok=True,
                status_code=200,
                json_data={"artifacts": [{"name": "vercel-build-preview", "archive_download_url": "https://api.github.com/a.zip"}]},
            )
        return MockResponse(ok=False, status_code=404)

    monkeypatch.setattr(module.requests, "get", fake_get)

    module.run()

    assert failures == []
    assert outputs["should_deploy"] == "true"
    assert outputs["artifact_download_url"] == "https://api.github.com/a.zip"
