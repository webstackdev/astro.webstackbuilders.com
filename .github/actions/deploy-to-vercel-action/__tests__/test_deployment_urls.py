from __future__ import annotations

from pathlib import Path
from types import ModuleType

import pytest


def load_deployment_urls_module() -> ModuleType:
    action_root = Path(__file__).resolve().parents[1]
    module_path = action_root / "src" / "deployment_urls.py"

    import importlib.util
    import sys

    spec = importlib.util.spec_from_file_location("deploy_to_vercel_deployment_urls", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_build_deployment_urls_pr_without_preview_domain() -> None:
    module = load_deployment_urls_module()

    result = module.build_deployment_urls(
        is_pr=True,
        pr_preview_domain=None,
        alias_domains=None,
        deployment_host="my-deploy.vercel.app",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="feature/test",
        pr_number=123,
        sha="abcdef0123456789",
    )

    assert result.aliases_to_assign == []
    assert result.deployment_urls == ["https://my-deploy.vercel.app"]
    assert result.preview_url == "https://my-deploy.vercel.app"


def test_build_deployment_urls_pr_with_preview_domain_alias_first() -> None:
    module = load_deployment_urls_module()

    result = module.build_deployment_urls(
        is_pr=True,
        pr_preview_domain="{REPO}-{PR}.vercel.app",
        alias_domains=None,
        deployment_host="my-deploy.vercel.app",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="feature/test",
        pr_number=42,
        sha="abcdef0123456789",
    )

    assert result.aliases_to_assign == ["astro-webstackbuilders-com-42.vercel.app"]
    assert result.deployment_urls == [
        "https://astro-webstackbuilders-com-42.vercel.app",
        "https://my-deploy.vercel.app",
    ]
    assert result.preview_url == "https://astro-webstackbuilders-com-42.vercel.app"


def test_preview_domain_truncation_matches_vercel_rules() -> None:
    module = load_deployment_urls_module()

    # Create a prefix >= 60 chars before the .vercel.app suffix.
    long_prefix = "a" * 60
    pr_preview_domain = f"{long_prefix}.vercel.app"

    result = module.build_deployment_urls(
        is_pr=True,
        pr_preview_domain=pr_preview_domain,
        alias_domains=None,
        deployment_host="my-deploy.vercel.app",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="feature/test",
        pr_number=1,
        sha="abcdef0123456789",
    )

    assert result.truncated_preview_alias_from == long_prefix
    assert result.truncated_preview_alias_to is not None

    # Truncated prefix should be 55 chars, then '-' + 6 hex, then suffix.
    assert result.truncated_preview_alias_to.startswith("a" * 55 + "-")
    assert result.truncated_preview_alias_to.endswith(".vercel.app")

    # Ensure output ordering is preserved.
    assert result.deployment_urls[0] == f"https://{result.truncated_preview_alias_to}"
    assert result.deployment_urls[-1] == "https://my-deploy.vercel.app"


def test_build_deployment_urls_non_pr_with_alias_domains() -> None:
    module = load_deployment_urls_module()

    result = module.build_deployment_urls(
        is_pr=False,
        pr_preview_domain=None,
        alias_domains=["{REPO}.example.com", "{REPO}-{SHA}.example.com"],
        deployment_host="my-prod.vercel.app",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="main",
        pr_number=None,
        sha="abcdef0123456789",
    )

    assert result.aliases_to_assign == [
        "astro-webstackbuilders-com.example.com",
        "astro-webstackbuilders-com-abcdef0.example.com",
    ]
    assert result.deployment_urls == [
        "https://astro-webstackbuilders-com.example.com",
        "https://astro-webstackbuilders-com-abcdef0.example.com",
        "https://my-prod.vercel.app",
    ]
    assert result.preview_url == "https://astro-webstackbuilders-com.example.com"


def test_compute_pr_preview_alias_does_not_truncate_when_not_vercel_app() -> None:
    module = load_deployment_urls_module()

    alias, truncated_from, truncated_to = module.compute_pr_preview_alias(
        pr_preview_domain="{BRANCH}.example.com",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="a" * 80,
        pr_number=123,
        sha="abcdef0123456789",
    )

    assert truncated_from is None
    assert truncated_to is None
    assert alias.endswith(".example.com")


def test_compute_pr_preview_alias_does_not_truncate_under_limit() -> None:
    module = load_deployment_urls_module()

    prefix = "a" * 59
    alias, truncated_from, truncated_to = module.compute_pr_preview_alias(
        pr_preview_domain=f"{prefix}.vercel.app",
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="main",
        pr_number=1,
        sha="abcdef0123456789",
    )

    assert alias == f"{prefix}.vercel.app"
    assert truncated_from is None
    assert truncated_to is None


@pytest.mark.parametrize(
    ("template", "expected"),
    [
        ("{USER}-{REPO}-{BRANCH}-{SHA}", "webstackdev-astro-webstackbuilders-com-feat-abcdef0"),
        ("{REPO}", "astro-webstackbuilders-com"),
    ],
)
def test_compute_alias_domain_substitutions(template: str, expected: str) -> None:
    module = load_deployment_urls_module()

    alias = module.compute_alias_domain(
        alias_domain=template,
        user="webstackdev",
        repository="astro.webstackbuilders.com",
        branch="feat",
        sha="abcdef0123456789",
    )

    assert alias == expected
