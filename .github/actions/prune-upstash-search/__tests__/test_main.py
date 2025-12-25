from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("prune_upstash_search", module_path)
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


def test_content_file_to_url_path_handles_index_and_extensions() -> None:
    module = load_action_module()

    assert (
        module.content_file_to_url_path(
            filename="src/content/articles/some-article/index.mdx",
            content_root="src/content/",
            collection="articles",
        )
        == "/articles/some-article"
    )

    assert (
        module.content_file_to_url_path(
            filename="src/content/services/some-service/index.md",
            content_root="src/content",
            collection="services",
        )
        == "/services/some-service"
    )

    assert (
        module.content_file_to_url_path(
            filename="src/content/case-studies/foo.mdx",
            content_root="src/content/",
            collection="case-studies",
        )
        == "/case-studies/foo"
    )

    assert (
        module.content_file_to_url_path(
            filename="src/content/articles/index.mdx",
            content_root="src/content/",
            collection="articles",
        )
        == "/articles"
    )


def test_skips_when_no_previous_success(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "ghs_xxx")
    monkeypatch.setenv("INPUT_WORKFLOW_FILE", "deployment-production.yml")
    monkeypatch.setenv("INPUT_BASE_BRANCH", "main")
    monkeypatch.setenv("INPUT_CURRENT_RUN_ID", "123")
    monkeypatch.setenv("INPUT_HEAD_SHA", "def456")
    monkeypatch.setenv("INPUT_UPSTASH_URL", "https://search.upstash.io")
    monkeypatch.setenv("INPUT_UPSTASH_TOKEN", "token")
    monkeypatch.setenv("INPUT_INDEX_NAME", "default")
    monkeypatch.setenv("INPUT_SITE_ORIGIN", "https://www.webstackbuilders.com")
    monkeypatch.setenv("INPUT_COLLECTION", "articles")

    def fake_get(url: str, headers: dict[str, str], params: dict[str, object] | None = None, timeout: int = 30) -> FakeResponse:
        assert url.endswith("/actions/workflows/deployment-production.yml/runs")
        return FakeResponse(status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "failure"}]})

    monkeypatch.setattr(module.requests, "get", fake_get)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["deleted_count"] == "0"


def test_deletes_removed_docs(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "ghs_xxx")
    monkeypatch.setenv("INPUT_WORKFLOW_FILE", "deployment-production.yml")
    monkeypatch.setenv("INPUT_BASE_BRANCH", "main")
    monkeypatch.setenv("INPUT_CURRENT_RUN_ID", "999")
    monkeypatch.setenv("INPUT_HEAD_SHA", "newsha")
    monkeypatch.setenv("INPUT_UPSTASH_URL", "https://search.upstash.io")
    monkeypatch.setenv("INPUT_UPSTASH_TOKEN", "token")
    monkeypatch.setenv("INPUT_INDEX_NAME", "default")
    monkeypatch.setenv("INPUT_SITE_ORIGIN", "https://www.webstackbuilders.com/")
    monkeypatch.setenv("INPUT_COLLECTION", "articles")

    def fake_get(url: str, headers: dict[str, str], params: dict[str, object] | None = None, timeout: int = 30) -> FakeResponse:
        if url.endswith("/actions/workflows/deployment-production.yml/runs"):
            return FakeResponse(status_code=200, json_data={"workflow_runs": [{"id": 123, "conclusion": "success", "head_sha": "oldsha"}]})
        assert url.endswith("/compare/oldsha...newsha")
        return FakeResponse(
            status_code=200,
            json_data={
                "files": [
                    {"filename": "src/content/articles/removed-article/index.mdx", "status": "removed"},
                    {"filename": "src/content/articles/removed-article/cover.jpg", "status": "removed"},
                    {"filename": "src/content/services/consulting/index.mdx", "status": "removed"},
                    {"filename": "README.md", "status": "removed"},
                ]
            },
        )

    monkeypatch.setattr(module.requests, "get", fake_get)

    deleted_calls: list[list[str]] = []

    class FakeIndex:
        def delete(self, *, ids=None, prefix=None, filter=None):
            assert prefix is None
            assert filter is None
            deleted_calls.append(list(ids or []))
            return len(ids or [])

    class FakeClient:
        def index(self, name: str):
            assert name == "default"
            return FakeIndex()

    monkeypatch.setattr(module, "Search", lambda url, token: FakeClient())

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["deleted_count"] == "1"
    assert deleted_calls == [["https://www.webstackbuilders.com/articles/removed-article"]]
