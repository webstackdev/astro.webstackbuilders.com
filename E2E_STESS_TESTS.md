<!-- markdownlint-disable-file -->
# E2E Stress Tests

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot.

## Problems Areas

### Service Worker Enablement

- **Symptom:**

PWA specs intermittently wait more than 30 seconds for `navigator.serviceWorker.ready`, suggesting `window.__disableServiceWorkerForE2E` may remain `true` despite `PwaPage.enableServiceWorkerForE2E()`.

- **Diagnostics:**

  - Add guarded logs inside `PwaPage.enableServiceWorkerForE2E()` and `registerServiceWorker()` to capture `window.__disableServiceWorkerForE2E` before and after the override.

  - Audit `addInitScript` ordering to ensure no later script reverts the flag, then rerun the PWA spec suite to collect console output.

### Theme Picker Reload Policy

- **Symptom:**

`theme-picker.spec.ts` fails on WebKit with `page.reload: Navigation canceled by policy check` when `setupCleanTestPage()` forces a hard reload to reset cookies.

- **Diagnostics:**

  - Instrument `helpers/cookieHelper.ts` to capture the URL and policy state when the reload is blocked.

  - Evaluate alternative reset flows (for example, `page.goto()` with a cache-busting query) so tests do not rely on reload semantics that WebKit disallows under our CSP/service-worker combo.

## LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS

- **2025-12-03 - Carousel/Testimonial hydration:** Added `@webcomponents/template-shadowroot@0.2.1` dependency so Vite can resolve the polyfill required by `@semantic-ui/astro-lit`; reran `testimonials.spec.ts` in Chromium/WebKit with Playwright-only logging to confirm the custom elements initialize and pagination dots update in WebKit.

## CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED
