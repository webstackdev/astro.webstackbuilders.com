from __future__ import annotations

import io
import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import urlparse

import requests
from actions_toolkit import core


def get_input_compat(name: str, *, required: bool = False) -> str:
    value = core.get_input(name, required=False)
    if value:
        return value.strip()

    normalized = name.replace(" ", "_").upper()
    candidates = {normalized, normalized.replace("-", "_"), normalized.replace("_", "-")}
    for candidate in candidates:
        env_value = os.getenv(f"INPUT_{candidate}", "")
        if env_value:
            return env_value.strip()

    if required:
        return core.get_input(name, required=True)
    return ""


def get_github_api_base_url() -> str:
    raw = (os.environ.get("GITHUB_API_URL") or "https://api.github.com").strip()
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        raise ValueError(f"Unsupported GITHUB_API_URL protocol: {parsed.scheme}")
    return raw if raw.endswith("/") else f"{raw}/"


def is_allowed_fetch_url(url: str, allowed_hosts: set[str]) -> bool:
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname in allowed_hosts


def run() -> None:
    try:
        token = get_input_compat("github-token", required=True)
        download_url = get_input_compat("artifact-download-url", required=True).strip()

        allowed_hosts = {urlparse(get_github_api_base_url()).hostname}
        if not is_allowed_fetch_url(download_url, allowed_hosts):
            raise ValueError(f"Blocked outbound request to untrusted URL: {download_url}")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "webstackbuilders-download-build-artifact-action",
        }

        response = requests.get(download_url, headers=headers, timeout=60)
        if not response.ok:
            raise RuntimeError(f"Failed to download artifact (status {response.status_code}).")

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            zip_path = temp_path / "artifact.zip"
            zip_path.write_bytes(response.content)

            extract_dir = temp_path / "extract"
            extract_dir.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
                zip_ref.extractall(extract_dir)

            candidates = [extract_dir / ".vercel" / "output", extract_dir / "output"]
            source = next((p for p in candidates if p.is_dir()), None)
            if not source:
                raise RuntimeError("Downloaded artifact did not contain expected output directory.")

            target = Path(".vercel") / "output"
            if target.exists():
                shutil.rmtree(target)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source, target)

            core.info(f"Restored Vercel output to {target}")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
