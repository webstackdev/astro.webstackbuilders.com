<!-- markdownlint-disable-file -->
# E2E Stress Tests

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot.

## Problems Areas

### 1. Carousel / Testimonials Hydration Regressions

- **Symptom:**

`testimonials.spec.ts` consistently fails in WebKit because the target pagination dot never registers as selected (`Expected: 1 Received: 0`). Earlier stress runs also timed out waiting for `data-carousel-ready`, implying the custom element never finishes initialization.

- **Diagnostics:**

  - Inspect built HTML for `/testing/carousel` and the home page to confirm the inline `<script type="module">` blocks that call `register{Carousel,Testimonials}WebComponent()` survive bundling and execute under Playwright.

  - Capture console output during a focused run (e.g., `testimonials.spec.ts` on Chromium) to see whether Embla throws inside `initialize()` or whether `handleScriptError` tears the element down before setting `data-carousel-ready`.

  - Added Playwright-only console instrumentation inside `CarouselElement` and `TestimonialsCarouselElement` to log register/initialize start, success, and failure events. Run the targeted specs and collect console output to see whether these hooks fire.

### 2. Service Worker Enablement

- **Symptom:**

PWA specs intermittently wait more than 30 seconds for `navigator.serviceWorker.ready`, suggesting `window.__disableServiceWorkerForE2E` may remain `true` despite `PwaPage.enableServiceWorkerForE2E()`.

- **Diagnostics:**

  - Log the flag inside `registerServiceWorker()` to prove whether our init script overrides take effect before the registration guard runs.

  - Audit `addInitScript` ordering to ensure no later script reverts the flag.

### 3. Theme Picker Reload Policy

- **Symptom:**

`theme-picker.spec.ts` fails on WebKit with `page.reload: Navigation canceled by policy check` when `setupCleanTestPage()` forces a hard reload to reset cookies.

- **Diagnostics:**

  - Instrument `helpers/cookieHelper.ts` to capture the URL and policy state when the reload is blocked.

  - Evaluate alternative reset flows (for example, `page.goto()` with a cache-busting query) so tests do not rely on reload semantics that WebKit disallows under our CSP/service-worker combo.

## LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS

## CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED
