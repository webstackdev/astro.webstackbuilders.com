from __future__ import annotations

import json
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("resolve_deploy_sha", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def create_temp_event_file(tmp_path: Path, payload: dict[str, Any]) -> str:
    event_path = tmp_path / "event.json"
    event_path.write_text(json.dumps(payload), encoding="utf-8")
    return str(event_path)


def test_resolves_sha_from_workflow_run(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(
        tmp_path,
        {
            "workflow_run": {
                "head_sha": "abc123",
                "event": "pull_request",
                "head_branch": "feature/test",
                "pull_requests": [{"head": {"repo": {"fork": False}}}],
            }
        },
    )

    monkeypatch.setenv("GITHUB_EVENT_NAME", "workflow_run")
    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["sha"] == "abc123"
    assert outputs["trigger_event"] == "pull_request"
    assert outputs["head_branch"] == "feature/test"
    assert outputs["is_fork"] == "false"


def test_resolves_sha_from_env_for_workflow_dispatch(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_action_module()

    event_path = create_temp_event_file(tmp_path, {"inputs": {}})
    monkeypatch.setenv("GITHUB_EVENT_NAME", "workflow_dispatch")
    monkeypatch.setenv("GITHUB_EVENT_PATH", event_path)
    monkeypatch.setenv("GITHUB_SHA", "def456")
    monkeypatch.setenv("GITHUB_REF_NAME", "main")

    outputs: dict[str, str] = {}
    monkeypatch.setattr(module.core, "set_output", lambda k, v: outputs.__setitem__(k, v))
    monkeypatch.setattr(module.core, "set_failed", lambda m: (_ for _ in ()).throw(AssertionError(m)))

    module.run()

    assert outputs["sha"] == "def456"
    assert outputs["trigger_event"] == "workflow_dispatch"
    assert outputs["head_branch"] == "main"
    assert outputs["is_fork"] == "false"
