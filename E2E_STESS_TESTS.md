<!-- markdownlint-disable-file -->
# E2E Stress Tests

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot. If there are multiple errors, build a numbered list in "Problem Areas" section with symptoms and diagnostics. Then we can move to troubleshooting, fixing, and reporting findings.

## Problems Areas

1. **Environment diagnostics page never resolves**

  - **Symptom:** All three `environmentClient.spec.ts` tests time out at `navigateToDiagnosticsPage()` because `BasePage.waitForFunction()` never receives the readiness signal (Chrome, 30s timeout).

  - **Diagnostics:** Inspect `/diagnostics/environment` (or whichever route `environmentClient` uses) while Playwright is connected to verify the page is actually hydrating. Capture console logs/network tab to see whether the diagnostics bundle is blocked by CSP or service worker caching. Confirm the helper that sets `window.__environmentDiagnosticsReady` still runs after recent bootstrap changes.

2. **Dynamic imports to `environmentClient.ts` fail in browser context**

  - **Symptom:** Every package-release/privacy-policy integration test throws `Failed to fetch dynamically imported module: http://localhost:4321/src/components/scripts/utils/environmentClient.ts` when calling `page.evaluate(() => import('/src/components/scripts/utils/environmentClient.ts'))`.

  - **Diagnostics:** Reproduce manually in devtools to see the exact network error (404 vs MIME/CSP). Verify Vite/Astro still exposes that path in dev server. Consider switching tests to import via the published bundle path (e.g., `/@fs/...` or `@components/scripts/utils/environmentClient`) instead of hard-coded `/src/...` to match current Vite behavior.

3. **Cron cleanup endpoint intermittently hangs**

  - **Symptom:** `cron.spec.ts › cleanup-confirmations removes expired and stale rows` fails with `apiRequestContext.get: socket hang up` against `http://localhost:4321/api/cron/cleanup-confirmations` (Chrome only, mock auth header present).

  - **Diagnostics:** Check dev server logs for that request to confirm whether the endpoint crashes or never responds. Re-run the spec with `DEBUG=astro:*` to capture server-side stack traces. Validate the mock Supabase/Upstash containers are healthy before the cron suite runs (missing dependency could keep the endpoint hanging while waiting on Redis/Supabase).

## LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS

### Theme Picker Reload Policy

- **Symptom:**

`theme-picker.spec.ts` fails on WebKit with `page.reload: Navigation canceled by policy check` when `setupCleanTestPage()` forces a hard reload to reset cookies.

- **Diagnostics:**

- Instrument `helpers/cookieHelper.ts` to capture the URL and policy state when the reload is blocked.

- Evaluate alternative reset flows (for example, `page.goto()` with a cache-busting query) so tests do not rely on reload semantics that WebKit disallows under our CSP/service-worker combo.

- **Findings:**

- Added Playwright-only logging to `setupCleanTestPage` so every reload/cache-busting navigation now reports URL, document readiness, storage state, and navigation type to the console (prefixed with `ThemePicker:*`).

- `CI=1 FORCE_COLOR=1 npx playwright test test/e2e/specs/04-components/theme-picker.spec.ts --project=webkit` now completes all 14 tests without triggering WebKit's policy check. Instrumentation confirms the reload path executes and reports `navigationType: 'reload'`, so the flake has not reproduced since adding the logging.

- **Resolution**

Theme Picker reload diagnostics: Instrumented `setupCleanTestPage` with Playwright-only snapshots and re-ran the WebKit theme picker suite; no policy-check cancellations observed, but logs now capture sufficient context if the flake returns.

## CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED
