<!-- markdownlint-disable-file -->
# E2E Stress Tests

## Instructions

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot. If there are multiple errors, build a numbered list in "Problem Areas" section with symptoms, diagnostics, any history of attempted fixes, and remediation plans. Check Git history for the last seven days for activity in the affected files. Then we can move to troubleshooting, fixing, and reporting findings.

## Problems Areas

1. **Newsletter submit button fails to disable (WebKit)**

  - **Symptom:** After the fifth consecutive full-suite run, `test/e2e/specs/03-forms/newsletter-subscription.spec.ts › @ready submit button disables during pending request` timed out on WebKit because `#newsletter-submit` never entered the disabled state within the 2 s expectation window. The Playwright log shows the locator remained enabled while `/api/newsletter` was being delayed via `delayFetchForEndpoint()`.

  - **Diagnostics:**
    - Re-run the spec in isolation (`CI=1 FORCE_COLOR=1 npx playwright test test/e2e/specs/03-forms/newsletter-subscription.spec.ts --project=webkit --debug`) and watch the console for `[fetch-override]` output to confirm the delay hook actually intercepts `fetch('/api/newsletter')`.
    - Add temporary logging around the `#newsletter-submit` component (or expose a test-only data attribute) to capture the internal `isSubmitting` flag so we can verify whether the UI ever toggles `disabled` or if WebKit's synthetic click bypasses the Svelte/React handler.
    - Capture a trace or performance profile after several sequential suite runs to see if residual `globalThis.__fetchOverrideCallCounts` or lingering mocked responses keep the button from transitioning states. Ensure `delayOverride.restore()` executes even when the assertion fails.
    - Inspect the component code that controls the submit button state to ensure we're listening for `pending` network requests rather than relying on `fetch` promises that might short-circuit under the mock. Consider waiting on `expect.poll(async () => await submitButton.isDisabled())` instead of a fixed `toBeDisabled` to cope with slower WebKit event loops.

  - **History of attempted fixes (last 7 days):**
    - `8b1209ce` hardened the scenario by validating/regenerating GDPR DataSubjectId values so malformed IDs would no longer break consent logging during newsletter submissions.
    - `c78573f8` updated selectors inside `newsletter-subscription.spec.ts` to reduce earlier flakiness when locating the submit button.
    - `1c906a38` added mocked-latency coverage plus resilience checks for GDPR consent, ensuring the test framework could pause `/api/newsletter` without races.
    - `46dfb16f` introduced additional form helper logic (shared with the contact-form suites) that this spec now imports when navigating/filling inputs.
    - `3ae221dd` added the shared `EvaluationError` helper leveraged by the page objects when waiting for DOM conditions.

  - **Remediation ideas:** extend the artificial delay for WebKit (e.g., ≥800 ms) or assert against the internal `aria-disabled` state that the design system toggles before the actual `disabled` attribute flips. If repeated suite runs are the trigger, add a cleanup step that reloads the newsletter page or clears fetch overrides between projects so each run starts with a pristine button instance. Worst case, consider modeling the disable behavior in a dedicated component harness instead of the full stack, so we can deterministically stub the network layer without relying on WebKit's synchronous click timing.

## Issues On Hold

1. **Service worker suite times out across all browsers**

  - **Symptom:** Every test in `test/e2e/specs/09-pwa/service-worker.spec.ts` hit the 30 s Playwright timeout during `PwaPage.waitForServiceWorkerReady()`, so registration, cache hydration, and offline-fallback assertions never executed (see console section below — 19 failures across Chromium, Firefox, WebKit, Mobile Chrome/Safari, Microsoft Edge, and Google Chrome).

  - **Diagnostics:** Inspect dev server logs around `/test/e2e/specs/09-pwa/service-worker.spec.ts` to confirm the SW script (`/service-worker.js`) is requested and not blocked by our `window.__disableServiceWorkerForE2E` flag. Capture `browserContext.serviceWorkers()` output or add logging inside `PwaPage.waitForServiceWorkerReady()` to observe registration status/rejections. Validate the helper does not run during `about:blank` navigations and that the SW scope matches the tested routes. Verify the dev server is launched with HTTPS disabled headers for SW, and consider re-running with `DEBUG=astro:*` plus browser console logs to surface CSP or MIME errors preventing activation.

  - **History of attempted fixes (Dec 2 - Dec 3):**

    - `cea1e2e0` introduced `enableServiceWorkerForE2E()` inside `PwaPage.init()` so Playwright runs flip `window.__disableServiceWorkerForE2E` back to `false` before the layout script calls `registerServiceWorker()`. This ensured the tests explicitly re-enabled SW support after `BasePage.setupPlaywrightGlobals()` defaulted the flag to `true`.

    - `03d51d6b` layered additional console instrumentation in `PwaPage.enableServiceWorkerForE2E()` to log the flag's current value every time we attempt to toggle it, hoping to confirm whether the disable flag remained `true` when registration fired.

  - **Why these haven't helped:** neither change touched `test/e2e/specs/09-pwa/service-worker.spec.ts`, so the suite still just waits on `navigator.serviceWorker.ready`. Despite re-enabling the flag, every browser run continues to timeout, implying the registration path inside `src/components/Pwa/ServiceWorker/client/index.ts` still bails out (either because the disable flag flips back to `true` before the component executes, or because the dev-server guard sees `isDev()` without `isE2eTest()` and unregisters immediately). Until we capture the console output from `registerServiceWorker()` itself (or mock SW behavior), we keep investing effort without changing the conditions that cause `navigator.serviceWorker.ready` to never resolve. We may need to consider alternative strategies (e.g., mocking `navigator.serviceWorker`, stubbing `registerSW`, or providing a dedicated test harness) instead of continuing to patch the same page object.

Troubleshooting plan for the service-worker suite:

Confirm registration isn't being short-circuited. Add temporary logging inside index.ts around the early return that checks window.__disableServiceWorkerForE2E. Capture its value plus navigator.serviceWorker.controller to ensure PwaPage.enableServiceWorkerForE2E() actually flips the flag before registerServiceWorker() runs. If the flag stays true after navigation, move the flag override into the same init script that registers the service worker so it executes earlier.

Inspect service worker network activity. Re-run a single failing test (CI=1 FORCE_COLOR=1 npx playwright test [service-worker.spec.ts](http://_vscodecontentref_/4) --project=chromium --debug) and save page.on('console') + browserContext.serviceWorkers() output. Verify /service-worker.js responds with 200 over HTTPS-disabled dev server (SWs require secure context). If responses are 404/mime mismatch, fix the dev server route or ensure Vite/astro serve the script during npm run dev.

Instrument waitForServiceWorkerReady(). Inside PwaPage.waitForServiceWorkerReady, log the value of navigator.serviceWorker.ready resolution timing and catch errors to reveal whether readiness rejects or never resolves. If it hangs, check for navigator.serviceWorker.register rejections in the browser console (CSP, scope mismatch, or self.skipWaiting() misbehavior).

Validate SW scope and offline flags. After registration succeeds locally, assert the scope equals / via expectServiceWorkerScope('/'). If it doesn't, update the service worker script's registrationOptions or file location so the scope covers the tested routes. Also confirm no other helper (e.g., performance tests) is still forcing window.__disableServiceWorkerForE2E = true after the PWA page loads; search for additional writes to the flag and gate them behind if (!window.isPlaywrightControlled).

Check worker lifecycle hooks. Ensure the service worker calls self.clients.claim()/skipWaiting() so navigator.serviceWorker.ready resolves quickly. If those are missing, add them and rebuild. If they exist, consider awaiting registration.update() in the test before navigator.serviceWorker.ready to prompt activation.

Once these diagnostics show which step fails (flag stuck, script blocked, or activation delayed), we can either restructure the init scripts or adjust the service worker registration flow to ensure Playwright can observe readiness within the 30 s timeout.

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

  1) [webkit] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:212:3 › Newsletter Subscription Form › @ready submit button disables during pending request

    Error: expect(locator).toBeDisabled() failed

    Locator:  locator('#newsletter-submit')
    Expected: disabled
    Received: enabled
    Timeout:  2000ms

    Call log:
      - Expect "toBeDisabled" with timeout 2000ms
      - waiting for locator('#newsletter-submit')
        6 × locator resolved to <button type="submit" id="newsletter-submit" data-original-text="Subscribe" class="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">…</button>
          - unexpected value "enabled"


      230 |
      231 |     try {
    > 232 |       await expect(submitButton).toBeDisabled({ timeout: 2000 })
          |                                  ^
      233 |       await submitPromise
      234 |       await expect(submitButton).toBeEnabled({ timeout: 2000 })
      235 |     } finally {
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/03-forms/newsletter-subscription.spec.ts:232:34

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-newsletter-subscr-e86b0-bles-during-pending-request-webkit/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-newsletter-subscr-e86b0-bles-during-pending-request-webkit/error-context.md

  1 failed
    [webkit] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:212:3 › Newsletter Subscription Form › @ready submit button disables during pending request
