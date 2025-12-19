from __future__ import annotations

import os

from actions_toolkit import core
from libsql_client import create_client_sync


def get_optional_input_or_env(input_name: str, env_name: str) -> str:
    value = core.get_input(input_name).strip()
    if value:
        return value
    return (os.environ.get(env_name) or "").strip()


def get_required_value(value: str, label: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f"Missing {label}")
    return trimmed


def run() -> None:
    try:
        url = get_optional_input_or_env("astro-db-remote-url", "ASTRO_DB_REMOTE_URL")
        auth_token = get_optional_input_or_env("astro-db-app-token", "ASTRO_DB_APP_TOKEN")

        required_url = get_required_value(url, "ASTRO_DB_REMOTE_URL")
        required_auth_token = get_required_value(auth_token, "ASTRO_DB_APP_TOKEN")

        client = create_client_sync(url=required_url, auth_token=required_auth_token)
        try:
            client.execute("SELECT 1")
            core.info("[keep-alive] OK")
        finally:
            client.close()
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
