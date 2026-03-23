from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "upstash.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("keep_alive_upstash", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_fails_when_inputs_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "")

    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    module.run()

    assert failures == ["Missing url"]


def test_ranges_default_index(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "https://upstash.example.com"
        if name == "token":
            return "readonly-token"
        if name == "index_name":
            return ""
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    infos: list[str] = []
    failures: list[str] = []
    monkeypatch.setattr(module.core, "info", lambda message: infos.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    captured: dict[str, object] = {}

    class MockIndex:
        def range(self, *, limit: int = 1):
            captured["limit"] = limit
            return []

    class MockSearch:
        def __init__(self, *, url: str, token: str) -> None:
            captured["url"] = url
            captured["token"] = token

        def index(self, name: str) -> MockIndex:
            captured["index_name"] = name
            return MockIndex()

    monkeypatch.setattr(module, "Search", MockSearch)

    module.run()

    assert captured == {
        "url": "https://upstash.example.com",
        "token": "readonly-token",
        "index_name": "default",
        "limit": 1,
    }
    assert infos == ["[keep-alive] Upstash Search index 'default' OK"]
    assert failures == []


def test_uses_custom_index_name(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "https://upstash.example.com"
        if name == "token":
            return "readonly-token"
        if name == "index_name":
            return "pages"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    captured: dict[str, str] = {}

    class MockIndex:
        def range(self, *, limit: int = 1):
            return []

    class MockSearch:
        def __init__(self, *, url: str, token: str) -> None:
            return None

        def index(self, name: str) -> MockIndex:
            captured["index_name"] = name
            return MockIndex()

    monkeypatch.setattr(module, "Search", MockSearch)
    monkeypatch.setattr(module.core, "set_failed", lambda message: (_ for _ in ()).throw(AssertionError(message)))

    module.run()

    assert captured["index_name"] == "pages"


def test_sets_failed_when_upstash_call_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "https://upstash.example.com"
        if name == "token":
            return "readonly-token"
        if name == "index_name":
            return "default"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    class MockIndex:
        def range(self, *, limit: int = 1):
            raise RuntimeError("boom")

    class MockSearch:
        def __init__(self, *, url: str, token: str) -> None:
            return None

        def index(self, name: str) -> MockIndex:
            return MockIndex()

    monkeypatch.setattr(module, "Search", MockSearch)

    module.run()

    assert failures == ["boom"]