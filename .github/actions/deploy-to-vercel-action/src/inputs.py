from __future__ import annotations

import os


def get_env(name: str, default: str | None = None) -> str:
    value = (os.environ.get(name) or "").strip()
    if value:
        return value
    if default is not None:
        return default
    return ""


def get_input(name: str, default: str | None = None) -> str:
    # Composite actions do not automatically populate INPUT_* unless we do it.
    # Our action.yml maps inputs to INPUT_* environment variables.
    value = get_env(f"INPUT_{name.upper()}")
    if value:
        return value
    if default is not None:
        return default
    return ""


def parse_bool(value: str, default: bool) -> bool:
    trimmed = value.strip()
    if not trimmed:
        return default
    lowered = trimmed.lower()
    if lowered in {"true", "1", "yes", "y", "on"}:
        return True
    if lowered in {"false", "0", "no", "n", "off"}:
        return False
    return default


def parse_disableable_list(value: str, default: list[str] | None) -> list[str] | None:
    trimmed = value.strip()
    if not trimmed:
        return default
    if trimmed.lower() in {"false", "0", "no", "off"}:
        return None
    values = [line.strip() for line in trimmed.splitlines()]
    return [line for line in values if line]


def parse_list(value: str) -> list[str] | None:
    trimmed = value.strip()
    if not trimmed:
        return None
    values = [line.strip() for line in trimmed.splitlines()]
    return [line for line in values if line]
