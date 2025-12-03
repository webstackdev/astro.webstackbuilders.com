<!-- markdownlint-disable-file -->
# E2E Stress Tests

## Instructions

Our goal is to make the E2E test suite as deterministic as possible, so that we can use it as a gate for CI to make sure that commits and PRs on GitHub are not breaking existing code and can be merged to main. We've spent an entire day running the test cases and fixing errors. Each run, one or more new errors appear, we fix them, and do another run with the same result. The entire test suite seems very flaky.

When a problem area is resolved, add it to the "LOG OF FIXES APPLIED TO PROBLEMS IDENTIFIED DURING E2E STRESS TESTS" section below. The purpose of this log is to identify problems that have already been addressed, so we can determine if the fix worked if similar problems recur.

See the "CONSOLE OUTPUT FROM LAST E2E FULL RUN THAT ERRORED" section for the next set of problems to troubleshoot. If there are multiple errors, build a numbered list in "Problem Areas" section with symptoms, diagnostics, any history of attempted fixes, and remediation plans. Check Git history for the last seven days for activity in the affected files.

We're going to do a number of cycles of running E2E stress cycles and updating this document. I'd like to see if we can build a pattern to the errors. They are not occurring predictably; some runs complete with all tests passed, other runs have errors but not in the same test files deterministically.

Later we'll move to troubleshooting and fixing findings.

## Problems Areas

1. **Resend mock never receives requests (Firefox forms suites)**

  - **Symptom:** After the latest full-suite stress run on Dec 3 2025, every `@mocks` test in `test/e2e/specs/03-forms/contact-form.spec.ts` and `test/e2e/specs/03-forms/newsletter-double-optin.spec.ts` failed on Firefox with `wiremock.resend.expectRequest` timing out (`Expected resend mock to receive a matching request within 4000ms/7000ms`). The API calls to `/api/contact` and `/api/newsletter` completed, but the associated POSTs to `/emails` never appeared in the WireMock logs before the timeout.

  - **Diagnostics:**
    - Re-run the affected specs with mocks enabled to confirm whether the flake is deterministic. Commands executed Dec 3 2025:
      - `CI=1 FORCE_COLOR=1 E2E_MOCKS=1 npx playwright test test/e2e/specs/03-forms/contact-form.spec.ts --project=firefox` → 6 passed / 0 failed.
      - `CI=1 FORCE_COLOR=1 E2E_MOCKS=1 npx playwright test test/e2e/specs/03-forms/newsletter-double-optin.spec.ts --project=firefox` → 6 passed / 0 failed.
    - When the failure reproduces, fetch `wiremock.resend.findRequests({ urlPath: '/emails' })` directly from the troubleshooting console to see if the requests arrive late or not at all.
    - Capture dev-server stdout for `/api/contact` and `/api/newsletter` during Firefox runs to ensure the backend actually calls the Resend client (look for "Resend mock" breadcrumbs in `src/pages/api/contact/email.ts` or related logs).
    - Inspect container networking: confirm `RESEND_HTTP_PORT` and `E2E_MOCKS_HOST` match what Firefox can reach (especially if stress runs execute inside containers with a different loopback address).
    - Add temporary diagnostics inside `WiremockClient.expectRequest` to dump the current request list when timing out (helps determine whether filters are too strict vs. requests never arriving).

  - **History of attempted fixes (last 7 days):**
    - `2ee8c1a` (Dec 2) introduced the full newsletter double opt-in E2E coverage with WireMock, so the suite is new and may still need tuning.
    - `a0a4b75` (Dec 2) and `46dfb16f` (Dec 2) wired the contact-form E2E mocks into the stress harness; no dedicated stabilization work has landed since.
    - `d7a2820` (Dec 1) added the initial contact API E2E tests plus WireMock helpers—any regressions likely stem from networking or env setup rather than recent code edits.

  - **Remediation ideas:**
    - Increase the default `timeoutMs` for `wiremock.resend.expectRequest` when running under Firefox or when `CI=1`, since remote Docker networking may add >7 s latency.
    - Reset WireMock requests between tests in `contact-form.spec.ts` (similar to the `newsletter-double-optin` `beforeAll` hook) to avoid request pollution from previous suites.
    - Consider short-circuiting the Resend client entirely when `E2E_MOCKS=1` by writing the transactional payloads to disk and asserting against those files, reducing dependence on the mock server.
    - Ensure the stress runner exports `RESEND_MOCK_URL` using the host machine IP instead of `localhost` so Firefox inside Playwright can connect reliably.

2. **SEO meta description intermittently missing (Mobile Safari)**

  - **Symptom:** The latest stress run (Dec 3 2025) failed `test/e2e/specs/05-metadata/seo-tags.spec.ts › @ready all pages have meta description` on the `Mobile Safari` project. The locator `meta[name="description"]` never appeared within the 5 s expectation window on one of the navigations (Playwright timed out after 30 s overall).

  - **Diagnostics:**
    - Re-run the spec in isolation for the affected project (`CI=1 FORCE_COLOR=1 npx playwright test test/e2e/specs/05-metadata/seo-tags.spec.ts --project='Mobile Safari' --trace=retain-on-failure`) and capture console/network logs to see whether the `<meta name="description">` tag is missing or just delayed.
      - Result (Dec 3 2025): `CI=1 FORCE_COLOR=1 npx playwright test test/e2e/specs/05-metadata/seo-tags.spec.ts --project='Mobile Safari' --repeat-each=5` executed 75 tests with 0 failures, so the flake did not reproduce under repeated cold navigations.
    - Dump the rendered `<head>` HTML when the locator is undefined (e.g., `await page.content()` or a custom helper) to confirm whether `HeadContent` ever emitted the tag for each route in `pages = ['/', '/about', '/services', '/case-studies', '/contact']`.
    - Instrument `src/components/Head/Meta.astro` to log when descriptions fall back to `contactData.company.description` so we know if a page is skipping custom copy or the component is not mounting under Astro transitions.
    - Temporarily disable `ClientRouter` for the spec via an env flag to determine whether Astro View Transitions/head diffing is preventing the `<meta>` element from updating on Mobile Safari when multiple sequential `page.goto()` calls occur within the same test.

  - **History of attempted fixes (last 7 days):**
    - `99d008a0` (Nov 29) refactored theme initialization and View Transitions timing inside the head, so regressions could stem from those changes rather than content data.
    - `83ed1b15` (Nov 29) reworked the manifest + PWA wiring, which may influence which head tags survive across navigations when the client router is active.
    - `0d7b552a` (Nov 28) swapped generic `Error` usage for typed errors across helpers, touching the shared `BasePage` utilities used by this spec.

  - **Remediation ideas:**
    - Ensure every layout (e.g., `PageLayout.astro`, `MarkdownLayout.astro`) forwards a `description` prop into `BaseLayout` so `Meta.astro` always renders predictable content.
    - Add a dedicated helper inside `BasePage` to poll for `meta[name="description"]` and retry navigation if the tag fails to load, reducing Mobile Safari flakiness until the root cause is fixed.
    - If Astro View Transitions is reusing `<head>` elements, gate `ClientRouter` behind an env flag during SEO specs so each `page.goto()` forces a full reload and rewrites `<meta>` tags deterministically.

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

### Newsletter submit button never disabled (WebKit)

- **Symptom:** `test/e2e/specs/03-forms/newsletter-subscription.spec.ts › @ready submit button disables during pending request` timed out on WebKit because the button never entered the disabled state while `/api/newsletter` was being delayed.

- **Diagnostics:** Adding a `data-e2e-state` attribute to `NewsletterFormElement` exposed the internal loading flag so tests could assert deterministic transitions in addition to the `disabled` property.

- **Resolution:** Updated the component and spec to toggle `data-e2e-state` between `loading`/`idle` and wait for the actual `/api/newsletter` response before expecting the idle state. Verified with `CI=1 FORCE_COLOR=1 npx playwright test test/e2e/specs/03-forms/newsletter-subscription.spec.ts` (Dec 3 2025) — 84 tests passed.

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

Full stress-run failures:

  1) [Microsoft Edge] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:121:3 › Newsletter Subscription Form › @ready form resets after successful submission

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('#newsletter-message')
    Timeout: 5000ms
    - Expected substring  - 1
    + Received string     + 3

    - Please check your email to confirm your subscription
    +
    + You'll receive a confirmation email. Click the link to complete your subscription.
    +

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for locator('#newsletter-message')
        2 × locator resolved to <p role="status" aria-live="polite" id="newsletter-message" class="text-sm text-text-offset text-center text-[var(--color-text-offset)]">Sending confirmation email...</p>
          - unexpected value "Sending confirmation email..."
        - waiting for" http://localhost:4321/testing/newsletter" navigation to finish...
        - navigated to "http://localhost:4321/testing/newsletter"
        6 × locator resolved to <p role="status" aria-live="polite" id="newsletter-message" class="text-sm text-text-offset text-center">↵You'll receive a confirmation email. Click the l…</p>
          - unexpected value "
    You'll receive a confirmation email. Click the link to complete your subscription.
    "


       at ../helpers/pageObjectModels/NewsletterPage.ts:127

      125 |    */
      126 |   async expectMessageContains(text: string | RegExp): Promise<void> {
    > 127 |     await expect(this.page.locator(this.messageSelector)).toContainText(text)
          |                                                           ^
      128 |   }
      129 |
      130 |   /**
        at NewsletterPage.expectMessageContains (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/NewsletterPage.ts:127:59)
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/03-forms/newsletter-subscription.spec.ts:131:26

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-newsletter-subscr-0cd0b-after-successful-submission-Microsoft-Edge/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-newsletter-subscr-0cd0b-after-successful-submission-Microsoft-Edge/error-context.md

  2) [Microsoft Edge] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:170:3 › Newsletter Subscription Form › @ready API returns confirmation message

    Error: page.check: Clicking the checkbox did not change its state
    Call log:
      - waiting for locator('#newsletter-gdpr-consent')
        - locator resolved to <input value="true" name="consent" type="checkbox" aria-invalid="false" id="newsletter-gdpr-consent" aria-describedby="newsletter-gdpr-consent-description" class="border-2 border-border rounded mt-0.5 h-5 w-5 shrink-0 cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-primary checked:bg-primary checked:border-primary"/>
      - attempting click action
        - waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - locator resolved to <input value="true" name="consent" type="checkbox" aria-invalid="false" id="newsletter-gdpr-consent" aria-describedby="newsletter-gdpr-consent-description" class="border-2 border-border rounded mt-0.5 h-5 w-5 shrink-0 cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-primary checked:bg-primary checked:border-primary"/>
      - attempting click action
        2 × waiting for element to be visible, enabled and stable
          - element is not visible
        - retrying click action
        - waiting 20ms
        2 × waiting for element to be visible, enabled and stable
          - element is not visible
        - retrying click action
          - waiting 100ms
        - waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - performing click action
        - click action done
        - waiting for scheduled navigations to finish
        - navigations have finished


       at ../helpers/pageObjectModels/BasePage.ts:324

      322 |    */
      323 |   async check(selector: string): Promise<void> {
    > 324 |     await this._page.check(selector)
          |                      ^
      325 |   }
      326 |
      327 |   /**
        at NewsletterPage.check (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:324:22)
        at NewsletterPage.checkGdprConsent (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/NewsletterPage.ts:49:16)
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/03-forms/newsletter-subscription.spec.ts:178:26

    Error: page.waitForResponse: Test ended.
    =========================== logs ===========================
    waiting for response "/api/newsletter"
    ============================================================

       at ../helpers/pageObjectModels/BasePage.ts:531

      529 |     options?: { timeout?: number }
      530 |   ): Promise<Response> {
    > 531 |     return await this._page.waitForResponse(urlPattern, options)
          |                             ^
      532 |   }
      533 |
      534 |   /**
        at NewsletterPage.waitForResponse (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:531:29)
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/03-forms/newsletter-subscription.spec.ts:175:47

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-newsletter-subscr-07c54-eturns-confirmation-message-Microsoft-Edge/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-newsletter-subscr-07c54-eturns-confirmation-message-Microsoft-Edge/error-context.md

  3) [Microsoft Edge] › test/e2e/specs/04-components/breadcrumbs.spec.ts:14:3 › Breadcrumbs Component › @ready breadcrumbs display on article pages

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation

       at ../helpers/pageObjectModels/BasePage.ts:456

      454 |     )
      455 |
    > 456 |     this.lastAstroPageLoadCount = await this._page.evaluate(() => window.__astroPageLoadCounter ?? 0)
          |                                                    ^
      457 |   }
      458 |
      459 |   /**
        at BreadCrumbPage.waitForPageLoad (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:456:52)
        at BreadCrumbPage.navigateToListingDetail (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BreadCrumbPage.ts:60:5)
        at BreadCrumbPage.openFirstArticleDetail (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BreadCrumbPage.ts:64:5)
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/04-components/breadcrumbs.spec.ts:16:5

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/04-components-breadcrumbs--c7cfb-bs-display-on-article-pages-Microsoft-Edge/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

  4) [Microsoft Edge] › test/e2e/specs/04-components/breadcrumbs.spec.ts:21:3 › Breadcrumbs Component › @ready breadcrumbs display on service pages

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation

       at ../helpers/pageObjectModels/BasePage.ts:456

      454 |     )
      455 |
    > 456 |     this.lastAstroPageLoadCount = await this._page.evaluate(() => window.__astroPageLoadCounter ?? 0)
          |                                                    ^
      457 |   }
      458 |
      459 |   /**
        at BreadCrumbPage.waitForPageLoad (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:456:52)
        at BreadCrumbPage.navigateToListingDetail (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BreadCrumbPage.ts:60:5)
        at BreadCrumbPage.openFirstServiceDetail (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BreadCrumbPage.ts:74:5)
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/04-components/breadcrumbs.spec.ts:23:5

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/04-components-breadcrumbs--721a9-bs-display-on-service-pages-Microsoft-Edge/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

  5) [Microsoft Edge] › test/e2e/specs/04-components/breadcrumbs.spec.ts:28:3 › Breadcrumbs Component › @ready breadcrumbs display on case study pages

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation

       at ../helpers/pageObjectModels/BasePage.ts:456

      454 |     )
      455 |
    > 456 |     this.lastAstroPageLoadCount = await this._page.evaluate(() => window.__astroPageLoadCounter ?? 0)
          |                                                    ^
      457 |   }
      458 |
      459 |   /**
        at BreadCrumbPage.waitForPageLoad (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:456:52)
        at BreadCrumbPage.navigateToListingDetail (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BreadCrumbPage.ts:60:5)
        at BreadCrumbPage.openFirstCaseStudyDetail (/home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BreadCrumbPage.ts:84:5)
        at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/test/e2e/specs/04-components/breadcrumbs.spec.ts:30:5

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/04-components-breadcrumbs--6ac6a-display-on-case-study-pages-Microsoft-Edge/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

  5 failed
    [Microsoft Edge] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:121:3 › Newsletter Subscription Form › @ready form resets after successful submission
    [Microsoft Edge] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:170:3 › Newsletter Subscription Form › @ready API returns confirmation message
    [Microsoft Edge] › test/e2e/specs/04-components/breadcrumbs.spec.ts:14:3 › Breadcrumbs Component › @ready breadcrumbs display on article pages
    [Microsoft Edge] › test/e2e/specs/04-components/breadcrumbs.spec.ts:21:3 › Breadcrumbs Component › @ready breadcrumbs display on service pages
    [Microsoft Edge] › test/e2e/specs/04-components/breadcrumbs.spec.ts:28:3 › Breadcrumbs Component › @ready breadcrumbs display on case study pages
