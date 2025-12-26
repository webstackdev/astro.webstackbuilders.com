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

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "libsql://example.turso.io"
        if name == "token":
            return "token"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

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


def test_debug_logs_required_url(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("DEBUG", "1")

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "libsql://example.turso.io"
        if name == "token":
            return "token"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    called: dict[str, int] = {"diagnostics": 0}

    def fake_diagnostics(url: str) -> None:
        called["diagnostics"] += 1

    monkeypatch.setattr(module, "_debug_network_diagnostics", fake_diagnostics)

    infos: list[str] = []
    failures: list[str] = []
    monkeypatch.setattr(module.core, "info", lambda message: infos.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    class MockClient:
        def execute(self, sql: str) -> None:
            pass

        def close(self) -> None:
            pass

    monkeypatch.setattr(module, "create_client_sync", lambda **kwargs: MockClient())

    module.run()

    assert "[keep-alive] In debug mode" in infos
    assert any(item.startswith("[keep-alive] required_url=") for item in infos)
    assert "[keep-alive] succeeded_transport=libsql" in infos
    assert "[keep-alive] OK" in infos
    assert called["diagnostics"] == 1
    assert failures == []


def test_prefers_inputs_over_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("ASTRO_DB_REMOTE_URL", "libsql://env.turso.io")
    monkeypatch.setenv("ASTRO_DB_APP_TOKEN", "env_token")

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "libsql://input.turso.io"
        if name == "token":
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

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "libsql://example.turso.io"
        if name == "token":
            return "token"
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

    assert captured["url"] == "libsql://example.turso.io/"


def test_falls_back_to_https_when_websocket_not_supported(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "libsql://example.turso.io"
        if name == "token":
            return "token"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    infos: list[str] = []
    failures: list[str] = []
    monkeypatch.setattr(module.core, "info", lambda message: infos.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    created_urls: list[str] = []

    class FakeWsUnsupportedError(Exception):
        def __init__(self) -> None:
            super().__init__("WebSocket connections are not supported")
            self.status = 505

    class MockClient:
        def __init__(self, url: str) -> None:
            self.url = url

        def execute(self, sql: str) -> None:
            assert sql == "SELECT 1"
            if self.url.startswith("libsql://"):
                raise FakeWsUnsupportedError()

        def close(self) -> None:
            return None

    def fake_create_client_sync(**kwargs):
        url = kwargs.get("url")
        created_urls.append(url)
        return MockClient(url)

    monkeypatch.setattr(module, "create_client_sync", fake_create_client_sync)
    monkeypatch.setattr(module, "_debug_network_diagnostics", lambda _url: None)

    module.run()

    assert created_urls == ["libsql://example.turso.io/", "https://example.turso.io/"]
    assert infos == ["[keep-alive] OK"]
    assert failures == []


def test_falls_back_to_https_logs_succeeded_transport_in_debug(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("DEBUG", "1")

    def fake_get_input(name: str, required: bool = False) -> str:
        if name == "url":
            return "libsql://example.turso.io"
        if name == "token":
            return "token"
        return ""

    monkeypatch.setattr(module.core, "get_input", fake_get_input)

    infos: list[str] = []
    failures: list[str] = []
    monkeypatch.setattr(module.core, "info", lambda message: infos.append(message))
    monkeypatch.setattr(module.core, "set_failed", lambda message: failures.append(message))

    class FakeWsUnsupportedError(Exception):
        def __init__(self) -> None:
            super().__init__("WebSocket connections are not supported")
            self.status = 505

    class MockClient:
        def __init__(self, url: str) -> None:
            self.url = url

        def execute(self, sql: str) -> None:
            assert sql == "SELECT 1"
            if self.url.startswith("libsql://"):
                raise FakeWsUnsupportedError()

        def close(self) -> None:
            return None

    monkeypatch.setattr(module, "create_client_sync", lambda **kwargs: MockClient(kwargs.get("url")))
    monkeypatch.setattr(module, "_debug_network_diagnostics", lambda _url: None)

    module.run()

    assert "[keep-alive] In debug mode" in infos
    assert "[keep-alive] succeeded_transport=https" in infos
    assert "[keep-alive] OK" in infos
    assert failures == []
