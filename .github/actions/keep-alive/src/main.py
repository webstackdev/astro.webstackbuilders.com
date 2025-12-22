from __future__ import annotations

import os
import urllib.parse

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


def normalize_libsql_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)

    # libsql-client transforms libsql:// URLs into ws(s):// for Hrana WebSockets.
    # When the path is empty, some servers reject the handshake for `wss://host`
    # (no trailing slash). Normalize to `.../`.
    if parsed.scheme == "libsql" and parsed.netloc and parsed.path == "":
        parsed = parsed._replace(path="/")
        return urllib.parse.urlunparse(parsed)

    return url


def run() -> None:
    try:
        url = get_optional_input_or_env("astro-db-remote-url", "ASTRO_DB_REMOTE_URL")
        auth_token = get_optional_input_or_env("astro-db-app-token", "ASTRO_DB_APP_TOKEN")

        required_url = normalize_libsql_url(get_required_value(url, "ASTRO_DB_REMOTE_URL"))
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
