from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_action_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "main.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("deploy_to_vercel", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_parse_bool_defaults() -> None:
    module = load_action_module()

    assert module.parse_bool("", default=True) is True
    assert module.parse_bool("", default=False) is False


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("true", True),
        ("TRUE", True),
        ("1", True),
        ("yes", True),
        ("on", True),
        ("false", False),
        ("FALSE", False),
        ("0", False),
        ("no", False),
        ("off", False),
    ],
)
def test_parse_bool_values(value: str, expected: bool) -> None:
    module = load_action_module()
    assert module.parse_bool(value, default=not expected) is expected


def test_parse_disableable_list() -> None:
    module = load_action_module()

    assert module.parse_disableable_list("", default=["deployed"]) == ["deployed"]
    assert module.parse_disableable_list("false", default=["deployed"]) is None
    assert module.parse_disableable_list("\n\n  a\n  b\n\n", default=None) == ["a", "b"]


def test_url_helpers() -> None:
    module = load_action_module()

    assert module.add_schema("example.com") == "https://example.com"
    assert module.add_schema("https://example.com") == "https://example.com"
    assert module.remove_schema("https://example.com") == "example.com"
    assert module.remove_schema("http://example.com") == "example.com"


def test_url_safe_parameter() -> None:
    module = load_action_module()

    assert module.url_safe_parameter("Hello, world!") == "Hello--world-"
    assert module.url_safe_parameter("a_b~c") == "a_b~c"


def test_parse_deployment_host_prefers_last_url() -> None:
    module = load_action_module()

    output = "foo https://first.vercel.app\nbar https://second.vercel.app\n"
    assert module.parse_deployment_host(output) == "second.vercel.app"


def test_parse_deployment_host_raises_on_missing_url() -> None:
    module = load_action_module()

    with pytest.raises(RuntimeError, match="Could not parse deploymentUrl"):
        module.parse_deployment_host("no urls here")
