<!-- markdownlint-disable-file -->
# E2E Stress Tests

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot.

## Problems Areas

### 2. Service Worker Enablement (Monitoring)

- **Status:** Added Playwright-only logging inside `PwaPage.enableServiceWorkerForE2E()` and `registerServiceWorker()` to record the value of `window.__disableServiceWorkerForE2E`, plus dev/e2e flags, whenever the SW logic runs. Targeted runs of `test/e2e/specs/09-pwa/service-worker.spec.ts` in Chromium and WebKit now pass, and the logs confirm the flag flips to `false` before registration proceeds. Leaving the instrumentation in place through the next stress suite to ensure the readiness timeouts remain resolved.

### Theme Picker Reload Policy

- **Symptom:**

`theme-picker.spec.ts` fails on WebKit with `page.reload: Navigation canceled by policy check` when `setupCleanTestPage()` forces a hard reload to reset cookies.

- **Diagnostics:**

  - Instrument `helpers/cookieHelper.ts` to capture the URL and policy state when the reload is blocked.

  - Evaluate alternative reset flows (for example, `page.goto()` with a cache-busting query) so tests do not rely on reload semantics that WebKit disallows under our CSP/service-worker combo.

## LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS

## CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED
