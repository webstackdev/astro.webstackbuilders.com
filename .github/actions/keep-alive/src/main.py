from __future__ import annotations

import urllib.parse

from actions_toolkit import core
from libsql_client import create_client_sync

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
        url = core.get_input("url", required=True)
        auth_token = core.get_input("token", required=True)

        required_url = normalize_libsql_url(get_required_value(url, "url"))
        required_auth_token = get_required_value(auth_token, "token")

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
