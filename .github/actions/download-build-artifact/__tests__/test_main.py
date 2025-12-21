from __future__ import annotations

import io
import zipfile
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("download_build_artifact", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class MockResponse:
    def __init__(self, *, ok: bool, status_code: int, content: bytes):
        self.ok = ok
        self.status_code = status_code
        self.content = content


def make_zip_bytes() -> bytes:
    mem = io.BytesIO()
    with zipfile.ZipFile(mem, "w") as z:
        z.writestr(".vercel/output/config.json", "{}")
    return mem.getvalue()


def test_extracts_vercel_output(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    inputs = {"github-token": "ghs_test", "artifact-download-url": "https://api.github.com/art.zip"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    monkeypatch.setenv("GITHUB_API_URL", "https://api.github.com")

    zip_bytes = make_zip_bytes()

    def fake_get(url: str, **kwargs: Any) -> MockResponse:
        return MockResponse(ok=True, status_code=200, content=zip_bytes)

    monkeypatch.setattr(module.requests, "get", fake_get)

    cwd = Path.cwd()
    monkeypatch.chdir(tmp_path)

    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda m: failures.append(m))

    module.run()

    assert failures == []
    assert (tmp_path / ".vercel" / "output" / "config.json").exists()
    monkeypatch.chdir(cwd)
