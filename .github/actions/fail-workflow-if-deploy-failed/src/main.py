from __future__ import annotations

from actions_toolkit import core


def run() -> None:
    try:
        exit_code = int(core.get_input("exit-code", required=True).strip() or "1")
        if exit_code != 0:
            raise RuntimeError(f"Deploy failed with exit code {exit_code}")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
