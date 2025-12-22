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

    spec = importlib.util.spec_from_file_location("update_deploy_status", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class MockResponse:
    def __init__(self, *, ok: bool, status_code: int):
        self.ok = ok
        self.status_code = status_code


def test_sets_success_status(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_API_URL", "https://api.github.com")
    monkeypatch.setenv("GITHUB_RUN_ID", "123")
    monkeypatch.setenv("GITHUB_SERVER_URL", "https://github.com")

    inputs = {
        "token": "ghs_test",
        "deployment-id": "7",
        "exit-code": "0",
        "environment-url": "https://example",
        "success-description": "ok",
        "failure-description": "bad",
    }
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    captured: dict[str, Any] = {}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, Any], timeout: int) -> MockResponse:
        captured["json"] = json
        return MockResponse(ok=True, status_code=201)

    monkeypatch.setattr(module.requests, "post", fake_post)
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert captured["json"]["state"] == "success"
    assert captured["json"]["environment_url"] == "https://example"
