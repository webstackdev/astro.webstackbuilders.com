from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("fail_workflow_if_deploy_failed", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_fails_for_nonzero_exit_code(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "2")
    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda m: failures.append(m))

    module.run()

    assert failures == ["Deploy failed with exit code 2"]


def test_passes_for_zero_exit_code(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    monkeypatch.setattr(module.core, "get_input", lambda name, required=False: "0")
    failures: list[str] = []
    monkeypatch.setattr(module.core, "set_failed", lambda m: failures.append(m))

    module.run()

    assert failures == []
