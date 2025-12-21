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

    spec = importlib.util.spec_from_file_location("create_deploy_preview", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class MockResponse:
    def __init__(self, *, ok: bool, status_code: int, json_data: Any):
        self.ok = ok
        self.status_code = status_code
        self._json_data = json_data

    def json(self) -> Any:
        return self._json_data


def test_creates_preview_deployment(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_API_URL", "https://api.github.com")

    inputs = {"github-token": "ghs_test", "sha": "abc"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    captured: dict[str, Any] = {}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, Any], timeout: int) -> MockResponse:
        captured["url"] = url
        captured["json"] = json
        return MockResponse(ok=True, status_code=201, json_data={"id": 55})

    monkeypatch.setattr(module.requests, "post", fake_post)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert captured["json"]["environment"] == "preview"
    assert outputs["deployment_id"] == "55"
