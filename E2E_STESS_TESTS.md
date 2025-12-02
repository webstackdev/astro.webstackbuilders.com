<!-- markdownlint-disable-file -->
# E2E Stress Tests

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

## Problems Areas

### 1. Carousel / Testimonials Hydration Regressions

- **Symptom:**

`testimonials.spec.ts` consistently fails in WebKit because the target pagination dot never registers as selected (`Expected: 1 Received: 0`). Earlier stress runs also timed out waiting for `data-carousel-ready`, implying the custom element never finishes initialization.

- **Diagnostics:**

  - Inspect built HTML for `/testing/carousel` and the home page to confirm the inline `<script type="module">` blocks that call `register{Carousel,Testimonials}WebComponent()` survive bundling and execute under Playwright.

  - Capture console output during a focused run (e.g., `testimonials.spec.ts` on Chromium) to see whether Embla throws inside `initialize()` or whether `handleScriptError` tears the element down before setting `data-carousel-ready`.

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

## Coordinated Troubleshooting Plan

1. **Isolate failures quickly:**

Run the individual specs above in Chromium and WebKit to capture console logs, traces, and screenshots before applying fixes so we have solid before/after evidence.

2. **Instrument before patching:**

Add temporary logging hooks (build-script inspection, SW flag checks, reload diagnostics) to validate hypotheses with a single rerun, then remove or guard them once validated.

3. **Apply targeted fixes sequentially:**

Fix hydration/registration issues first because they affect multiple specs, then re-run only the impacted specs; once clean, fold in the PWA and theme-picker adjustments and repeat.

4. **Re-run stress subset:**

After each fix cluster, run a reduced but representative bundle (for example, `testimonials`, `theme-picker`, `pwa`) across browsers to catch regressions early.

5. **Full-suite verification:**

Once subsets are stable, kick off the full stress suite to confirm deterministic behavior, and keep this document updated with any new regressions instead of relying on scrollback.

4. **Re-run stress subset**
