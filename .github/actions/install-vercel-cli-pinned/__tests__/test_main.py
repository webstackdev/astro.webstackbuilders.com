from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("install_vercel_cli_pinned", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_installs_pinned_vercel_cli(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "50.1.3")

    called: list[list[str]] = []

    def fake_run(cmd: list[str], check: bool) -> None:
        assert check is True
        called.append(cmd)

    monkeypatch.setattr(module.subprocess, "run", fake_run)
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert called == [["npm", "install", "-g", "vercel@50.1.3"]]
