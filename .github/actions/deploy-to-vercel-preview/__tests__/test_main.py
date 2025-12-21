from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("deploy_to_vercel_preview", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class Completed:
    def __init__(self, returncode: int, stdout: str, stderr: str):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def test_parses_preview_url(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    inputs = {"vercel-token": "t", "vercel-org-id": "o", "vercel-project-id": "p"}
    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: inputs.get(name, ""))

    def fake_run(cmd: list[str], check: bool, capture_output: bool, text: bool, env: dict[str, str]):
        return Completed(0, "✅  Preview: https://example.vercel.app\n", "")

    monkeypatch.setattr(module.subprocess, "run", fake_run)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["exit_code"] == "0"
    assert outputs["deploy_url"] == "https://example.vercel.app"
