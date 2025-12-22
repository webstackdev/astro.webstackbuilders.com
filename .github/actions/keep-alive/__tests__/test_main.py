from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("keep_alive", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(autouse=True)
def clear_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ASTRO_DB_REMOTE_URL", raising=False)
    monkeypatch.delenv("ASTRO_DB_APP_TOKEN", raising=False)


def test_fails_when_env_vars_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "")

    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    called = {"execute": 0, "close": 0}

    class MockClient:
        def execute(self, sql: str) -> None:
            called["execute"] += 1

        def close(self) -> None:
            called["close"] += 1

    def fake_create_client_sync(**kwargs):
        return MockClient()

    monkeypatch.setattr(module, "create_client_sync", fake_create_client_sync)

    module.run()

    assert failures
    assert called["execute"] == 0
    assert called["close"] == 0


def test_executes_select_1_and_closes_client(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("ASTRO_DB_REMOTE_URL", "libsql://example.turso.io")
    monkeypatch.setenv("ASTRO_DB_APP_TOKEN", "token")
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "")

    infos: list[str] = []
    failures: list[str] = []
    monkeypatch.setattr(module.core, "info", lambda message: infos.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    called = {"execute": 0, "close": 0, "sql": None}

    class MockClient:
        def execute(self, sql: str) -> None:
            called["execute"] += 1
            called["sql"] = sql

        def close(self) -> None:
            called["close"] += 1

    def fake_create_client_sync(**kwargs):
        return MockClient()

    monkeypatch.setattr(module, "create_client_sync", fake_create_client_sync)

    module.run()

    assert called["sql"] == "SELECT 1"
    assert called["close"] == 1
    assert infos == ["[keep-alive] OK"]
    assert failures == []


def test_prefers_inputs_over_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("ASTRO_DB_REMOTE_URL", "libsql://env.turso.io")
    monkeypatch.setenv("ASTRO_DB_APP_TOKEN", "env_token")

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "astro-db-remote-url":
            return "libsql://input.turso.io"
        if name == "astro-db-app-token":
            return "input_token"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    captured: dict[str, str] = {}

    class MockClient:
        def execute(self, sql: str) -> None:
            pass

        def close(self) -> None:
            pass

    def fake_create_client_sync(**kwargs):
        captured.update({"url": kwargs.get("url"), "auth_token": kwargs.get("auth_token")})
        return MockClient()

    monkeypatch.setattr(module, "create_client_sync", fake_create_client_sync)

    module.run()

    assert captured["url"] == "libsql://input.turso.io/"
    assert captured["auth_token"] == "input_token"


def test_normalizes_libsql_url_to_include_trailing_slash(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("ASTRO_DB_REMOTE_URL", "libsql://example.turso.io")
    monkeypatch.setenv("ASTRO_DB_APP_TOKEN", "token")
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "")

    captured: dict[str, str] = {}

    class MockClient:
        def execute(self, sql: str) -> None:
            pass

        def close(self) -> None:
            pass

    def fake_create_client_sync(**kwargs):
        captured.update({"url": kwargs.get("url"), "auth_token": kwargs.get("auth_token")})
        return MockClient()

    monkeypatch.setattr(module, "create_client_sync", fake_create_client_sync)

    module.run()

    assert captured["url"] == "libsql://example.turso.io/"
