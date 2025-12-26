from __future__ import annotations

import json
import os
import sys

# pylint: disable=wrong-import-position,too-many-branches,too-many-statements

# Allow imports like `from context import build_context` when this file is executed directly
# (e.g. `python3 ${{ github.action_path }}/src/main.py`) or loaded via importlib in unit tests.
src_dir = os.path.dirname(__file__)
sys.path.insert(0, src_dir)

from context import build_context
from deployment_urls import build_deployment_urls
from github_client import GitHubClient
from io_utils import add_mask, log_info, log_warning, set_failed, set_output
from inputs import parse_bool, parse_disableable_list
from utils import add_schema, parse_deployment_host, remove_schema, url_safe_parameter
from vercel_client import VercelClient

_reexports = (
    parse_bool,
    parse_disableable_list,
    add_schema,
    remove_schema,
    url_safe_parameter,
    parse_deployment_host,
)


def _mask_secrets(ctx) -> None:
    add_mask(ctx.github_token)
    add_mask(ctx.vercel_token)
    add_mask(ctx.public_google_maps_api_key)
    add_mask(ctx.public_sentry_dsn)
    add_mask(ctx.public_upstash_search_rest_url)
    add_mask(ctx.public_upstash_search_readonly_token)


def _is_github_comment_permission_error(error: Exception) -> bool:
    message = str(error)
    return "failed (403)" in message and "Resource not accessible by integration" in message


def _handle_untrusted_fork_pr(ctx, github: GitHubClient) -> bool:
    if not ctx.is_fork:
        return False

    log_warning("PR is from fork; refusing to deploy")
    body = f"""
        Refusing to deploy this Pull Request to Vercel because it originates from @{ctx.actor}'s fork.

        **@{ctx.user}** This repository's deployment workflow does not deploy forked pull requests.
    """

    try:
        comment = github.create_comment(body)
        log_info(f"Comment created: {comment.get('html_url')}")
        set_output("COMMENT_CREATED", "true")
    except Exception as exc:
        if _is_github_comment_permission_error(exc):
            log_warning(f"Unable to comment on PR (permission denied): {exc}")
            set_output("COMMENT_CREATED", "false")
        else:
            raise

    set_output("DEPLOYMENT_CREATED", "false")
    log_info("Done")
    return True


def _create_github_deployment(github: GitHubClient) -> None:
    log_info("Creating GitHub deployment")
    deployment = github.create_deployment()
    deployment_id = deployment.get("id")
    log_info(f"Deployment #{deployment_id} created")
    github.update_deployment("pending")
    log_info(f"Deployment #{deployment_id} status changed to \"pending\"")


def _fetch_commit_metadata(github: GitHubClient) -> dict[str, str] | None:
    try:
        return github.get_commit()
    except Exception as exc:
        log_warning(f"Failed to fetch commit metadata: {exc}")
        return None


def _log_alias_truncation(ctx, deployment_urls_result) -> None:
    if not (ctx.is_pr and ctx.pr_preview_domain):
        return

    log_info("Assigning custom preview domain to PR")
    if deployment_urls_result.truncated_preview_alias_from and deployment_urls_result.truncated_preview_alias_to:
        log_warning(
            f"The alias {deployment_urls_result.truncated_preview_alias_from} exceeds 60 chars in length, "
            "truncating using vercel's rules."
        )
        log_info(f"Updated domain alias: {deployment_urls_result.truncated_preview_alias_to}")


def _create_pr_comment_body(*, ctx, preview_url: str, inspector_url: str) -> str:
    return f"""
        This pull request has been deployed to Vercel.

        <table>
            <tr>
                <td><strong>Latest commit:</strong></td>
                <td><code>{ctx.sha[:7]}</code></td>
            </tr>
            <tr>
                <td><strong>✅ Preview:</strong></td>
                <td><a href='{preview_url}'>{preview_url}</a></td>
            </tr>
            <tr>
                <td><strong>🔍 Inspect:</strong></td>
                <td><a href='{inspector_url}'>{inspector_url}</a></td>
            </tr>
        </table>

        [View Workflow Logs]({ctx.log_url})
    """


def _handle_pr_comment_and_labels(*, ctx, github: GitHubClient, preview_url: str, inspector_url: str) -> bool:
    if not ctx.is_pr:
        return False

    try:
        log_info("Checking for existing comment on PR")
        deleted_comment_id = github.delete_existing_comment()
        if deleted_comment_id:
            log_info(f"Deleted existing comment #{deleted_comment_id}")
    except Exception as exc:
        if _is_github_comment_permission_error(exc):
            log_warning(f"Unable to manage PR comments (permission denied): {exc}")
            return False
        raise

    comment_created = False
    try:
        log_info("Creating new comment on PR")
        body = _create_pr_comment_body(ctx=ctx, preview_url=preview_url, inspector_url=inspector_url)
        comment = github.create_comment(body)
        log_info(f"Comment created: {comment.get('html_url')}")
        comment_created = True
    except Exception as exc:
        if _is_github_comment_permission_error(exc):
            log_warning(f"Unable to create PR comment (permission denied): {exc}")
            return False
        raise

    if ctx.pr_labels:
        try:
            log_info("Adding label(s) to PR")
            labels = github.add_labels(ctx.pr_labels)
            names = [str((label or {}).get("name") or "").strip() for label in labels]
            names = [name for name in names if name]
            log_info(f"Label(s) \"{', '.join(names)}\" added")
        except Exception as exc:
            if _is_github_comment_permission_error(exc):
                log_warning(f"Unable to add PR labels (permission denied): {exc}")
            else:
                raise

    return comment_created


def run() -> None:
    try:
        ctx = build_context()
        _mask_secrets(ctx)

        github = GitHubClient(ctx)

        # Refuse to deploy an untrusted fork
        if _handle_untrusted_fork_pr(ctx, github):
            return

        _create_github_deployment(github)

        try:
            log_info("Creating deployment with Vercel CLI")
            log_info("Setting environment variables for Vercel CLI")

            vercel = VercelClient(ctx)
            commit = _fetch_commit_metadata(github)
            deployment_host = vercel.deploy(commit)

            log_info("Successfully deployed to Vercel!")

            result = build_deployment_urls(
                is_pr=ctx.is_pr,
                pr_preview_domain=ctx.pr_preview_domain,
                alias_domains=ctx.alias_domains,
                deployment_host=deployment_host,
                user=ctx.user,
                repository=ctx.repository,
                branch=ctx.branch,
                pr_number=ctx.pr_number,
                sha=ctx.sha,
            )

            _log_alias_truncation(ctx, result)

            if (not ctx.is_pr) and ctx.alias_domains:
                log_info("Assigning custom domains to Vercel deployment")

            for alias in result.aliases_to_assign:
                vercel.assign_alias(alias)

            deployment_urls = result.deployment_urls
            preview_url = result.preview_url

            deployment = vercel.get_deployment()
            deployment_id_value = str(deployment.get("id") or "").strip()
            inspector_url = str(deployment.get("inspectorUrl") or "").strip()

            log_info(f"Deployment \"{deployment_id_value}\" available at: {', '.join(deployment_urls)}")

            log_info('Changing GitHub deployment status to "success"')
            github.update_deployment("success", preview_url)

            comment_created = _handle_pr_comment_and_labels(
                ctx=ctx,
                github=github,
                preview_url=preview_url,
                inspector_url=inspector_url,
            )

            set_output("PREVIEW_URL", preview_url)
            set_output("DEPLOYMENT_URLS", json.dumps(deployment_urls))
            set_output("DEPLOYMENT_UNIQUE_URL", deployment_urls[-1])
            if deployment_id_value:
                set_output("DEPLOYMENT_ID", deployment_id_value)
            if inspector_url:
                set_output("DEPLOYMENT_INSPECTOR_URL", inspector_url)
            set_output("DEPLOYMENT_CREATED", "true")
            set_output("COMMENT_CREATED", "true" if comment_created else "false")

            log_info("Done")
        except Exception as exc:
            # Mirror JS behavior: mark deployment as failure if possible.
            try:
                github.update_deployment("failure")
            except Exception:
                pass
            raise exc
    except Exception as exc:
        set_failed(str(exc))


if __name__ == "__main__":
    run()
