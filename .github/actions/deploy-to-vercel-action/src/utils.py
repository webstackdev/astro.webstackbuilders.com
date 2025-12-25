from __future__ import annotations

import os
import re
import subprocess
import urllib.parse

from io_utils import log_debug


def url_safe_parameter(value: str) -> str:
    return re.sub(r"[^a-z0-9_~]", "-", value, flags=re.IGNORECASE)


def add_schema(url: str) -> str:
    if re.match(r"^https?://", url, flags=re.IGNORECASE):
        return url
    return f"https://{url}"


def remove_schema(url: str) -> str:
    return re.sub(r"^https?://", "", url, flags=re.IGNORECASE)


def exec_cmd(command: str, args: list[str], cwd: str | None) -> str:
    cwd_value = cwd.strip() if cwd else ""
    log_debug(f"EXEC: {command} {' '.join(args)} (cwd={cwd_value or '.'})")

    result = subprocess.run(
        [command, *args],
        cwd=cwd_value or None,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=os.environ.copy(),
    )

    if result.stdout:
        for line in result.stdout.splitlines():
            log_debug(line)

    if result.stderr:
        for line in result.stderr.splitlines():
            log_debug(line)

    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout or "").strip() or f"Command failed: {command}")

    return (result.stdout or "").strip()


def parse_deployment_host(cli_output: str) -> str:
    urls = re.findall(r"https?://[^\s]+", cli_output)
    if not urls:
        raise RuntimeError("Could not parse deploymentUrl")

    # Prefer the last URL (usually the Preview URL).
    parsed = urllib.parse.urlparse(urls[-1])
    if not parsed.netloc:
        raise RuntimeError("Could not parse deploymentUrl")
    return parsed.netloc
