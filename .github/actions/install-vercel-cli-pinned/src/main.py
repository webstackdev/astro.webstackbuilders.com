from __future__ import annotations

import subprocess

from actions_toolkit import core


def run() -> None:
    try:
        version = core.get_input("version", required=True).strip()
        if not version:
            raise ValueError("Missing version")

        subprocess.run(["npm", "install", "-g", f"vercel@{version}"], check=True)
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
