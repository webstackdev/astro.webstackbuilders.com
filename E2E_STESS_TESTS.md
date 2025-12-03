<!-- markdownlint-disable-file -->
# E2E Stress Tests

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot. If there are multiple errors, build a numbered list in "Problem Areas" section with symptoms and diagnostics. Then we can move to troubleshooting, fixing, and reporting findings.

## Problems Areas

_No active issues. Add new items here when the next flake appears._

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

### Cron Cleanup Endpoint Hang

- **Symptom:** `cron.spec.ts` intermittently failed on Chrome-based projects with `socket hang up`, and parallel runs across all Playwright projects deleted Supabase seeds before assertions executed.

- **Diagnostics:** Confirmed Supabase/Upstash dependencies occasionally came up late, and the suite executed on every Chromium-flavored project (`Google Chrome`, `Mobile Chrome`, `Microsoft Edge`), causing multiple workers to hit the same fixtures concurrently. Upstash seeds were also left behind between retries.

- **Findings:** Adding a dependency health gate eliminated the socket hang, but the spec still needed to run exactly once and clean up Redis state so retries start from a known baseline.

- **Resolution:** Limited the cron suite to the `chromium` project via `test.info().project.name`, added deterministic Supabase/Upstash cleanup (`ensureCronDependenciesHealthy`, Supabase ID tracking, and Upstash command helpers that restore `__cron_keepalive__` after each test), and re-ran `npx dotenv -e .env.development -- cross-env CI=1 FORCE_COLOR=1 E2E_MOCKS=1 npx playwright test test/e2e/specs/15-cron/cron.spec.ts`. The all-project run now reports 3 chromium passes and 18 skips with consistent Upstash state.

## CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED
