from __future__ import annotations

import io
import json
from pathlib import Path
from types import SimpleNamespace
import urllib.error

import pytest

def load_module(module_file: str, name: str):
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / module_file

    import importlib.util
    import sys

    action_src = str(action_root / "src")
    if action_src not in sys.path:
        sys.path.insert(0, action_src)

    spec = importlib.util.spec_from_file_location(name, module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_inputs_get_env_and_get_input(monkeypatch: pytest.MonkeyPatch) -> None:
    inputs = load_module("inputs.py", "deploy_to_vercel_inputs")

    monkeypatch.delenv("FOO", raising=False)
    assert inputs.get_env("FOO") == ""
    assert inputs.get_env("FOO", default="bar") == "bar"

    monkeypatch.setenv("FOO", "  hi  ")
    assert inputs.get_env("FOO") == "hi"

    monkeypatch.delenv("INPUT_TOKEN", raising=False)
    assert inputs.get_input("token") == ""
    assert inputs.get_input("token", default="x") == "x"

    monkeypatch.setenv("INPUT_TOKEN", "  abc  ")
    assert inputs.get_input("token") == "abc"


def test_inputs_parse_bool_edge_cases() -> None:
    inputs = load_module("inputs.py", "deploy_to_vercel_inputs_2")

    assert inputs.parse_bool("", default=True) is True
    assert inputs.parse_bool("maybe", default=True) is True
    assert inputs.parse_bool("maybe", default=False) is False


def test_inputs_parse_lists() -> None:
    inputs = load_module("inputs.py", "deploy_to_vercel_inputs_3")

    assert inputs.parse_disableable_list("\n\n a \n b \n\n", default=None) == ["a", "b"]
    assert inputs.parse_disableable_list("OFF", default=["x"]) is None
    assert inputs.parse_list("\n\n A \n B \n\n") == ["A", "B"]
    assert inputs.parse_list("\n\n") is None


def test_io_utils_set_output_writes_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    io_utils = load_module("io_utils.py", "deploy_to_vercel_io")

    out = tmp_path / "out.txt"
    monkeypatch.setenv("GITHUB_OUTPUT", str(out))

    io_utils.set_output("KEY", "VALUE")
    assert out.read_text(encoding="utf-8") == "KEY=VALUE\n"


def test_io_utils_set_output_falls_back_to_stdout(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture) -> None:
    io_utils = load_module("io_utils.py", "deploy_to_vercel_io_2")

    monkeypatch.delenv("GITHUB_OUTPUT", raising=False)
    io_utils.set_output("KEY", "VALUE")

    captured = capsys.readouterr().out
    assert "::set-output name=KEY::VALUE" in captured


def test_io_utils_add_mask(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture) -> None:
    io_utils = load_module("io_utils.py", "deploy_to_vercel_io_3")

    io_utils.add_mask("")
    assert capsys.readouterr().out == ""

    io_utils.add_mask(" secret ")
    assert "::add-mask:: secret " in capsys.readouterr().out


def test_io_utils_set_failed_exits(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture) -> None:
    io_utils = load_module("io_utils.py", "deploy_to_vercel_io_4")

    with pytest.raises(SystemExit) as exc:
        io_utils.set_failed("boom")

    assert exc.value.code == 1
    assert "::error::boom" in capsys.readouterr().out


def test_io_utils_log_helpers(capsys: pytest.CaptureFixture) -> None:
    io_utils = load_module("io_utils.py", "deploy_to_vercel_io_5")

    io_utils.log_info("hello")
    io_utils.log_warning("warn")

    out = capsys.readouterr().out
    assert "hello" in out
    assert "::warning::warn" in out


def test_utils_exec_cmd_success(monkeypatch: pytest.MonkeyPatch) -> None:
    utils = load_module("utils.py", "deploy_to_vercel_utils")

    class Result:
        returncode = 0
        stdout = "ok\n"
        stderr = ""

    def fake_run(*_args, **_kwargs):
        return Result()

    monkeypatch.setattr(utils.subprocess, "run", fake_run)

    assert utils.exec_cmd("echo", ["hi"], cwd=None) == "ok"


def test_utils_exec_cmd_failure_uses_stderr(monkeypatch: pytest.MonkeyPatch) -> None:
    utils = load_module("utils.py", "deploy_to_vercel_utils_2")

    class Result:
        returncode = 1
        stdout = ""
        stderr = "nope\n"

    def fake_run(*_args, **_kwargs):
        return Result()

    monkeypatch.setattr(utils.subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="nope"):
        utils.exec_cmd("vercel", ["--bad"], cwd=None)


def test_utils_parse_deployment_host_raises_on_empty_netloc() -> None:
    utils = load_module("utils.py", "deploy_to_vercel_utils_3")

    # URL exists, but has no netloc.
    with pytest.raises(RuntimeError, match="Could not parse deploymentUrl"):
        utils.parse_deployment_host("ok https://\n")


def test_context_build_context_pr(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    context = load_module("context.py", "deploy_to_vercel_context")

    payload = {
        "number": 7,
        "pull_request": {
            "head": {
                "sha": "abc123",
                "ref": "feature/one",
                "repo": {"full_name": "someone/fork"},
            },
            "user": {"login": "forker"},
        },
    }
    event_path = tmp_path / "event.json"
    event_path.write_text(json.dumps(payload), encoding="utf-8")

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "pull_request")
    monkeypatch.setenv("GITHUB_EVENT_PATH", str(event_path))
    monkeypatch.setenv("GITHUB_RUN_ID", "123")

    # required inputs
    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "gh")
    monkeypatch.setenv("INPUT_VERCEL_TOKEN", "vt")
    monkeypatch.setenv("INPUT_VERCEL_ORG_ID", "oid")
    monkeypatch.setenv("INPUT_VERCEL_PROJECT_ID", "pid")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAP_ID", "mapid")
    monkeypatch.setenv("INPUT_PUBLIC_SENTRY_DSN", "dsn")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_REST_URL", "https://upstash")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN", "ro")

    ctx = context.build_context()
    assert ctx.is_pr is True
    assert ctx.pr_number == 7
    assert ctx.branch == "feature/one"
    assert ctx.ref == "feature/one"
    assert ctx.sha == "abc123"
    assert ctx.actor == "forker"
    assert ctx.is_fork is True
    assert ctx.production is False


def test_context_load_event_payload_returns_empty_on_invalid_json(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    context = load_module("context.py", "deploy_to_vercel_context_1b")

    bad = tmp_path / "bad.json"
    bad.write_text("{ not json", encoding="utf-8")
    monkeypatch.setenv("GITHUB_EVENT_PATH", str(bad))

    assert context.load_event_payload() == {}


def test_context_build_context_non_pr_branch_extract(monkeypatch: pytest.MonkeyPatch) -> None:
    context = load_module("context.py", "deploy_to_vercel_context_2")

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/main")
    monkeypatch.setenv("GITHUB_SHA", "deadbeef")

    # required inputs
    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "gh")
    monkeypatch.setenv("INPUT_VERCEL_TOKEN", "vt")
    monkeypatch.setenv("INPUT_VERCEL_ORG_ID", "oid")
    monkeypatch.setenv("INPUT_VERCEL_PROJECT_ID", "pid")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAP_ID", "mapid")
    monkeypatch.setenv("INPUT_PUBLIC_SENTRY_DSN", "dsn")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_REST_URL", "https://upstash")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN", "ro")

    ctx = context.build_context()
    assert ctx.is_pr is False
    assert ctx.branch == "main"
    assert ctx.ref == "refs/heads/main"
    assert ctx.sha == "deadbeef"


def test_context_build_context_validates_repo_format(monkeypatch: pytest.MonkeyPatch) -> None:
    context = load_module("context.py", "deploy_to_vercel_context_3")

    monkeypatch.setenv("GITHUB_REPOSITORY", "not-valid")
    with pytest.raises(ValueError, match="owner/repo"):
        context.build_context()


def test_context_build_context_requires_tokens(monkeypatch: pytest.MonkeyPatch) -> None:
    context = load_module("context.py", "deploy_to_vercel_context_4")

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/main")
    monkeypatch.setenv("GITHUB_SHA", "deadbeef")

    monkeypatch.delenv("INPUT_GITHUB_TOKEN", raising=False)
    monkeypatch.delenv("INPUT_GH_PAT", raising=False)
    monkeypatch.setenv("INPUT_VERCEL_TOKEN", "vt")
    monkeypatch.setenv("INPUT_VERCEL_ORG_ID", "oid")
    monkeypatch.setenv("INPUT_VERCEL_PROJECT_ID", "pid")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAP_ID", "mapid")
    monkeypatch.setenv("INPUT_PUBLIC_SENTRY_DSN", "dsn")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_REST_URL", "https://upstash")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN", "ro")

    with pytest.raises(ValueError, match="GITHUB_TOKEN"):
        context.build_context()


@pytest.mark.parametrize(
    ("missing_env", "expected"),
    [
        ("INPUT_VERCEL_TOKEN", "VERCEL_TOKEN"),
        ("INPUT_VERCEL_ORG_ID", "VERCEL_ORG_ID"),
        ("INPUT_VERCEL_PROJECT_ID", "VERCEL_PROJECT_ID"),
    ],
)
def test_context_build_context_requires_vercel_inputs(
    monkeypatch: pytest.MonkeyPatch, missing_env: str, expected: str
) -> None:
    context = load_module("context.py", f"deploy_to_vercel_context_missing_{missing_env}")

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/main")
    monkeypatch.setenv("GITHUB_SHA", "deadbeef")

    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "gh")
    monkeypatch.setenv("INPUT_VERCEL_TOKEN", "vt")
    monkeypatch.setenv("INPUT_VERCEL_ORG_ID", "oid")
    monkeypatch.setenv("INPUT_VERCEL_PROJECT_ID", "pid")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAP_ID", "mapid")
    monkeypatch.setenv("INPUT_PUBLIC_SENTRY_DSN", "dsn")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_REST_URL", "https://upstash")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN", "ro")
    monkeypatch.delenv(missing_env, raising=False)

    with pytest.raises(ValueError, match=expected):
        context.build_context()


def test_context_build_context_sets_placeholder_sha(monkeypatch: pytest.MonkeyPatch) -> None:
    context = load_module("context.py", "deploy_to_vercel_context_sha_placeholder")

    monkeypatch.setenv("GITHUB_REPOSITORY", "webstackdev/astro.webstackbuilders.com")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/main")
    monkeypatch.delenv("GITHUB_SHA", raising=False)

    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "gh")
    monkeypatch.setenv("INPUT_VERCEL_TOKEN", "vt")
    monkeypatch.setenv("INPUT_VERCEL_ORG_ID", "oid")
    monkeypatch.setenv("INPUT_VERCEL_PROJECT_ID", "pid")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAPS_API_KEY", "maps")
    monkeypatch.setenv("INPUT_PUBLIC_GOOGLE_MAP_ID", "mapid")
    monkeypatch.setenv("INPUT_PUBLIC_SENTRY_DSN", "dsn")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_REST_URL", "https://upstash")
    monkeypatch.setenv("INPUT_PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN", "ro")

    ctx = context.build_context()
    assert ctx.sha == "XXXXXXX"


def test_github_client_delete_existing_comment(monkeypatch: pytest.MonkeyPatch) -> None:
    github_client = load_module("github_client.py", "deploy_to_vercel_github")

    ctx = SimpleNamespace(
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        pr_number=1,
        github_token="gh",
        production=False,
        github_deployment_env=None,
        ref="main",
        log_url="https://example.com/logs",
    )

    client = github_client.GitHubClient(ctx)

    deleted: list[int] = []

    def fake_list():
        return [
            {"id": 10, "body": "not it"},
            {"id": 11, "body": "This pull request has been deployed to Vercel."},
        ]

    def fake_delete(comment_id: int) -> None:
        deleted.append(comment_id)

    monkeypatch.setattr(client, "list_pr_comments", fake_list)
    monkeypatch.setattr(client, "delete_comment", fake_delete)

    assert client.delete_existing_comment() == 11
    assert deleted == [11]


def test_github_api_request_success_and_http_error(monkeypatch: pytest.MonkeyPatch) -> None:
    github_client = load_module("github_client.py", "deploy_to_vercel_github_api")

    class FakeResponse:
        def __init__(self, body: bytes) -> None:
            self._body = body

        def read(self) -> bytes:
            return self._body

        def __enter__(self):
            return self

        def __exit__(self, _exc_type, _exc, _tb):
            return False

    def fake_urlopen_ok(_req, timeout: int):
        assert timeout == 30
        return FakeResponse(b"{\"ok\": true}")

    monkeypatch.setattr(github_client.urllib.request, "urlopen", fake_urlopen_ok)
    assert github_client.github_api_request(token="t", method="GET", url="https://api.github.com/x") == {"ok": True}

    def fake_urlopen_fail(_req, timeout: int):
        raise urllib.error.HTTPError(
            url="https://api.github.com/x",
            code=401,
            msg="no",
            hdrs=None,
            fp=io.BytesIO(b"{\"message\": \"bad\"}"),
        )

    monkeypatch.setattr(github_client.urllib.request, "urlopen", fake_urlopen_fail)
    with pytest.raises(RuntimeError, match=r"\(401\)"):
        github_client.github_api_request(token="t", method="GET", url="https://api.github.com/x")


def test_github_client_create_deployment_and_update(monkeypatch: pytest.MonkeyPatch) -> None:
    github_client = load_module("github_client.py", "deploy_to_vercel_github_client")

    calls: list[tuple[str, str, dict]] = []

    def fake_api_request(*, token: str, method: str, url: str, body=None):
        calls.append((method, url, body or {}))
        if url.endswith("/deployments"):
            return {"id": 123}
        return {"ok": True}

    monkeypatch.setattr(github_client, "github_api_request", fake_api_request)

    ctx = SimpleNamespace(
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        pr_number=None,
        github_token="gh",
        production=True,
        github_deployment_env="CustomEnv",
        ref="main",
        log_url="https://example.com/logs",
    )

    client = github_client.GitHubClient(ctx)
    deployment = client.create_deployment()
    assert deployment["id"] == 123
    assert client.deployment_id == 123

    client.update_deployment("pending", url="https://preview")
    assert any("/deployments" in url for _m, url, _b in calls)


def test_vercel_api_request_success_and_http_error(monkeypatch: pytest.MonkeyPatch) -> None:
    vercel_client = load_module("vercel_client.py", "deploy_to_vercel_vercel_api")

    class FakeResponse:
        def __init__(self, body: bytes) -> None:
            self._body = body

        def read(self) -> bytes:
            return self._body

        def __enter__(self):
            return self

        def __exit__(self, _exc_type, _exc, _tb):
            return False

    def fake_urlopen_ok(_req, timeout: int):
        assert timeout == 30
        return FakeResponse(b"{\"id\": \"d\"}")

    monkeypatch.setattr(vercel_client.urllib.request, "urlopen", fake_urlopen_ok)
    assert vercel_client.vercel_api_request(token="t", url="https://api.vercel.com/x") == {"id": "d"}

    def fake_urlopen_fail(_req, timeout: int):
        raise urllib.error.HTTPError(
            url="https://api.vercel.com/x",
            code=500,
            msg="no",
            hdrs=None,
            fp=io.BytesIO(b"oops"),
        )

    monkeypatch.setattr(vercel_client.urllib.request, "urlopen", fake_urlopen_fail)
    with pytest.raises(RuntimeError, match=r"\(500\)"):
        vercel_client.vercel_api_request(token="t", url="https://api.vercel.com/x")


def test_vercel_client_deploy_builds_args(monkeypatch: pytest.MonkeyPatch) -> None:
    vercel_client = load_module("vercel_client.py", "deploy_to_vercel_vercel_client")

    seen: dict[str, object] = {}

    def fake_exec_cmd(command: str, args: list[str], cwd):
        seen["command"] = command
        seen["args"] = args
        seen["cwd"] = cwd
        return "Ready! https://my-deploy.vercel.app"

    monkeypatch.setattr(vercel_client, "exec_cmd", fake_exec_cmd)

    ctx = SimpleNamespace(
        vercel_org_id="org",
        vercel_project_id="proj",
        vercel_token="token",
        vercel_scope="scope",
        production=True,
        working_directory="/tmp",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        ref="main",
        sha="abcdef0123456789",
    )

    client = vercel_client.VercelClient(ctx)
    host = client.deploy({"authorName": "A", "authorLogin": "B", "commitMessage": "line1\nline2"})
    assert host == "my-deploy.vercel.app"

    args = seen["args"]
    assert "--prod" in args
    assert "--prebuilt" in args
    assert "--force" in args
    assert any(item.startswith("--token=") for item in args)
    assert any(item.startswith("--scope=") for item in args)
    assert any("githubCommitMessage=line1" in item for item in args)


def test_vercel_client_assign_alias(monkeypatch: pytest.MonkeyPatch) -> None:
    vercel_client = load_module("vercel_client.py", "deploy_to_vercel_vercel_client_2")

    calls: list[list[str]] = []

    def fake_exec_cmd(_command: str, args: list[str], _cwd):
        calls.append(args)
        return "ok"

    monkeypatch.setattr(vercel_client, "exec_cmd", fake_exec_cmd)

    ctx = SimpleNamespace(
        vercel_org_id="org",
        vercel_project_id="proj",
        vercel_token="token",
        vercel_scope=None,
        production=False,
        working_directory=None,
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        ref="main",
        sha="abcdef0",
    )

    client = vercel_client.VercelClient(ctx)
    client.deployment_host = "my-deploy.vercel.app"
    client.assign_alias("https://custom.example.com")

    assert calls
    assert calls[0][0].startswith("--token=")
    assert calls[0][-1] == "custom.example.com"


def test_vercel_client_init_sets_env(monkeypatch: pytest.MonkeyPatch) -> None:
    vercel_client = load_module("vercel_client.py", "deploy_to_vercel_vercel")

    ctx = SimpleNamespace(
        vercel_org_id="org",
        vercel_project_id="proj",
        vercel_token="token",
        vercel_scope=None,
        production=False,
        working_directory=None,
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        ref="main",
        sha="abcdef0",
    )

    monkeypatch.delenv("VERCEL_ORG_ID", raising=False)
    monkeypatch.delenv("VERCEL_PROJECT_ID", raising=False)

    vercel_client.VercelClient(ctx)

    assert "VERCEL_ORG_ID" in vercel_client.os.environ
    assert "VERCEL_PROJECT_ID" in vercel_client.os.environ
    assert vercel_client.os.environ["VERCEL_ORG_ID"] == "org"
    assert vercel_client.os.environ["VERCEL_PROJECT_ID"] == "proj"
