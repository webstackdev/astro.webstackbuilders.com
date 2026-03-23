from __future__ import annotations

from actions_toolkit import core
from upstash_search import Search


def get_required_value(value: str, label: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f"Missing {label}")
    return trimmed


def run() -> None:
    try:
        url = get_required_value(core.get_input("url", required=True), "url")
        token = get_required_value(core.get_input("token", required=True), "token")
        index_name = get_required_value(core.get_input("index_name") or "default", "index_name")

        client = Search(url=url, token=token)
        client.index(index_name).range(limit=1)

        core.info(f"[keep-alive] Upstash Search index '{index_name}' OK")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()