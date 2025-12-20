# Refactor Action Workflows

We're going to refactor our current GitHub Action workflows to accomplish the following:

- Move the build from Vercel to GitHub, and deploy the built artifacts to Vercel
- Implement artifact-based deploy to avoid untrusted checked-out code in privileged contexts
- Run jobs in appropriate environments instead of not specifying environment
- @TODO: how? Improve hotfix branch skip handling
- Move deployment status updates from comments to deployment dialog
- merge-group setup

a "fan-in verifier" design that keeps independent workflows but verifies required checks across the SHA.

A "fan‑in verifier" keeps lint/unit/e2e (and anything else) as independent workflows, but adds one small "gate" job in the deploy (or publish) workflow that, given a target SHA, queries GitHub for the check results on that commit (e.g., via the Checks API / "check-runs for a ref", optionally falling back to workflow runs if needed), compares them against a hardcoded allowlist of required check names, and fails unless every required check exists and is in a terminal success state; it also typically enforces "not skipped" semantics by treating missing checks, neutral, skipped, or cancelled as failures (with narrowly scoped exceptions like your hotfix/* bypass), so the deploy only proceeds when the aggregate set of checks across multiple workflow runs has converged to "all green for this SHA," without needing to couple the workflows together with workflow_run chains.

Use Environment variables (non-secret):

ASTRO_DB_REMOTE_URL
COMPOSE_PROJECT_NAME
CONVERTKIT_FORM_ID
CONVERTKIT_HTTP_PORT
DEV_SERVER_PORT
PUBLIC_GOOGLE_MAPS_API_KEY
RESEND_HTTP_PORT
SENTRY_DSN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

Use Environment secrets (sensitive):

ASTRO_DB_APP_TOKEN
CONVERTKIT_API_KEY
CRON_SECRET
RESEND_API_KEY
SENTRY_AUTH_TOKEN
VERCEL_TOKEN
WEBMENTION_IO_TOKEN
