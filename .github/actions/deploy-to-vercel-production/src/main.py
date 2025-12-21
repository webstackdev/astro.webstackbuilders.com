from __future__ import annotations

import os
import re
import subprocess

from actions_toolkit import core


DEPLOY_URL_PATTERN = re.compile(r"^(?:✅\s+)?(?:Preview|Production):\s+(https://\S+)", re.MULTILINE)


def run() -> None:
    try:
        vercel_token = core.get_input("vercel-token", required=True)
        vercel_org_id = core.get_input("vercel-org-id", required=True)
        vercel_project_id = core.get_input("vercel-project-id", required=True)

        env = {
            "VERCEL_ORG_ID": vercel_org_id,
            "VERCEL_PROJECT_ID": vercel_project_id,
        }

        cmd = [
            "vercel",
            "deploy",
            "--prebuilt",
            "--target=production",
            "--archive=tgz",
            "--token",
            vercel_token,
            "--yes",
        ]

        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            env={
                **os.environ,
                **env,
            },
        )
        output = (completed.stdout or "") + (completed.stderr or "")

        match = DEPLOY_URL_PATTERN.search(output)
        deploy_url = match.group(1) if match else ""

        core.set_output("exit_code", str(completed.returncode))
        core.set_output("deploy_url", deploy_url)

        if completed.returncode != 0:
            core.warning("Vercel deploy failed (production).")
    except Exception as exc:  # noqa: BLE001
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
