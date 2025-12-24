from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("determine_search_index_scope", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class FakeResponse:
    def __init__(self, *, status_code: int, json_data: object) -> None:
        self.status_code = status_code
        self._json_data = json_data
        self.text = ""

    def json(self) -> object:
        return self._json_data


def test_indexes_all_when_no_previous_success(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("INPUT_TOKEN", "ghs_xxx")
    monkeypatch.setenv("INPUT_WORKFLOW_FILE", "deployment-production.yml")
    monkeypatch.setenv("INPUT_BASE_BRANCH", "main")
    monkeypatch.setenv("INPUT_CURRENT_RUN_ID", "123")
    monkeypatch.setenv("INPUT_HEAD_SHA", "def456")

    def fake_get(url: str, headers: dict[str, str], params: dict[str, object] | None = None, timeout: int = 30) -> FakeResponse:
        assert url.endswith("/actions/workflows/deployment-production.yml/runs")
        return FakeResponse(status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "failure"}]})

    monkeypatch.setattr(module.requests, "get", fake_get)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["should_index"] == "true"
    assert outputs["crawl_articles"] == "true"
    assert outputs["crawl_services"] == "true"
    assert outputs["crawl_case_studies"] == "true"


def test_skips_when_no_content_changes(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("INPUT_TOKEN", "ghs_xxx")
    monkeypatch.setenv("INPUT_WORKFLOW_FILE", "deployment-production.yml")
    monkeypatch.setenv("INPUT_BASE_BRANCH", "main")
    monkeypatch.setenv("INPUT_CURRENT_RUN_ID", "999")
    monkeypatch.setenv("INPUT_HEAD_SHA", "newsha")

    def fake_get(url: str, headers: dict[str, str], params: dict[str, object] | None = None, timeout: int = 30) -> FakeResponse:
        if url.endswith("/actions/workflows/deployment-production.yml/runs"):
            return FakeResponse(status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "success", "head_sha": "oldsha"}]})
        assert url.endswith("/compare/oldsha...newsha")
        return FakeResponse(status_code=200, json_data={"files": [{"filename": "README.md"}]})

    monkeypatch.setattr(module.requests, "get", fake_get)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["should_index"] == "false"
    assert outputs["crawl_articles"] == "false"
    assert outputs["crawl_services"] == "false"
    assert outputs["crawl_case_studies"] == "false"


def test_only_articles_changed(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("INPUT_TOKEN", "ghs_xxx")
    monkeypatch.setenv("INPUT_CURRENT_RUN_ID", "999")
    monkeypatch.setenv("INPUT_HEAD_SHA", "newsha")

    def fake_get(url: str, headers: dict[str, str], params: dict[str, object] | None = None, timeout: int = 30) -> FakeResponse:
        if url.endswith("/actions/workflows/deployment-production.yml/runs"):
            return FakeResponse(status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "success", "head_sha": "oldsha"}]})
        assert url.endswith("/compare/oldsha...newsha")
        return FakeResponse(status_code=200, json_data={"files": [{"filename": "src/content/articles/a.md"}]})

    monkeypatch.setattr(module.requests, "get", fake_get)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["should_index"] == "true"
    assert outputs["crawl_articles"] == "true"
    assert outputs["crawl_services"] == "false"
    assert outputs["crawl_case_studies"] == "false"


def test_other_content_changed_indexes_all(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("INPUT_TOKEN", "ghs_xxx")
    monkeypatch.setenv("INPUT_CURRENT_RUN_ID", "999")
    monkeypatch.setenv("INPUT_HEAD_SHA", "newsha")

    def fake_get(url: str, headers: dict[str, str], params: dict[str, object] | None = None, timeout: int = 30) -> FakeResponse:
        if url.endswith("/actions/workflows/deployment-production.yml/runs"):
            return FakeResponse(status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "success", "head_sha": "oldsha"}]})
        assert url.endswith("/compare/oldsha...newsha")
        return FakeResponse(
            status_code=200,
            json_data={
                "files": [
                    {"filename": "src/content/authors/x.md"},
                    {"filename": "src/content/articles/a.md"},
                ]
            },
        )

    monkeypatch.setattr(module.requests, "get", fake_get)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["should_index"] == "true"
    assert outputs["crawl_articles"] == "true"
    assert outputs["crawl_services"] == "true"
    assert outputs["crawl_case_studies"] == "true"
