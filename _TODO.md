<!-- markdownlint-disable-file -->
# TODO

## E2E Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18)

Playwright's Built-in Visual Testing

Playwright has a built-in visual comparison feature using await expect(page).toHaveScreenshot().

How it works: On the first run, Playwright saves a baseline screenshot. Subsequent runs compare the actual screenshot to this baseline, failing the test if there are pixel differences.

Pros: It's free, everything stays local (no third-party services needed), setup is simple, and you retain full control over the baseline images in your repository.

Cons: Browser rendering can be inconsistent across different operating systems and machines, leading to "flaky" tests or false positives. Managing baselines for multiple browsers and resolutions manually can also be challenging at scale.

Axe accessibility (2) - axe-core integration

## Search UI

- Move search box into header. Should be an icon like theme picker and hamburger menu, and spread out when clicked.
- On search results page, center results on page
- Improve indexing and how contents are returned.

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway


## Testimonials on mobile

We have E2E errors again testimonials slide on mobile chrome and safari. I think the problem is that we are pausing carousels when part of the carousel is outside of the viewport, and the testimonials are too large to display on mobile without being off viewport.

`test/e2e/specs/04-components/testimonials.spec.ts`:244:3 › Testimonials Component › @ready testimonials auto-rotate changes slide index

## Move containers to dev server from Playwright

We should start the mock containers with the dev server instead of with Playwright so that they're useable in a dev environment.

## Add Tooltip component

We need a Tooltip component. It should apply to the existing tooltips on the theme picker palettes.

## Improve print layout by hiding header and footer for articles, add tracking

```typescript
window.addEventListener('beforeprint', (event) => {
  console.log('Before print dialog opens, run this script.')
  // Example: change content or hide elements
  document.getElementById('hide-on-print').style.display = 'none'
})

window.addEventListener('afterprint', (event) => {
  console.log('After print dialog closes, run this script to revert changes.')
  // Example: revert changes
  document.getElementById('hide-on-print').style.display = ''
  // You can also use this event to send an AJAX request to a server for print tracking.
})
```

Or listen for changes:

```typescript
if (window.matchMedia) {
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function(mql) {
        if (mql.matches) {
            // Equivalent to onbeforeprint
            console.log('Entering print mode (before print dialog)');
        } else {
            // Equivalent to onafterprint
            console.log('Exiting print mode (after print dialog)');
        }
    });
}
```

## E2E Test Errors

test/e2e/specs/03-forms/newsletter-double-optin.spec.ts
test/e2e/specs/04-components/animations-computers.spec.ts
test/e2e/specs/04-components/social-shares.spec.ts
test/e2e/specs/04-components/theme-picker.spec.ts
test/e2e/specs/10-system/package-release.spec.ts
test/e2e/specs/14-regression/hero-animation-mobile-menu-pause.spec.ts

  1) [mobile-safari] › test/e2e/specs/03-forms/consent-checkbox.spec.ts:82:3 › Newsletter GDPR Consent › @ready GDPR label contains privacy policy link

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      65 |   let playwrightPage: Page
      66 |
    > 67 |   test.beforeEach(async ({ page }) => {
         |        ^
      68 |     playwrightPage = page
      69 |     pageUnderTest = await BasePage.init(page)
      70 |     await pageUnderTest.goto(HOME_PATH)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:67:8

    Error: page.waitForLoadState: Test timeout of 30000ms exceeded.

       at ../helpers/pageObjectModels/BuiltInsPage.ts:229

      227 |    */
      228 |   async waitForLoadState(state?: Parameters<Page['waitForLoadState']>[0]): Promise<void> {
    > 229 |     await this._page.waitForLoadState(state)
          |                      ^
      230 |   }
      231 |
      232 |   /**
        at BasePage.waitForLoadState (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BuiltInsPage.ts:229:22)
        at waitForNewsletterSection (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:31:14)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:71:11

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-consent-checkbox--fb743-ontains-privacy-policy-link-mobile-safari/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-consent-checkbox--fb743-ontains-privacy-policy-link-mobile-safari/error-context.md

  2) [mobile-safari] › test/e2e/specs/03-forms/consent-checkbox.spec.ts:88:3 › Newsletter GDPR Consent › @ready privacy policy link opens in new tab

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      65 |   let playwrightPage: Page
      66 |
    > 67 |   test.beforeEach(async ({ page }) => {
         |        ^
      68 |     playwrightPage = page
      69 |     pageUnderTest = await BasePage.init(page)
      70 |     await pageUnderTest.goto(HOME_PATH)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:67:8

    Error: page.waitForLoadState: Test timeout of 30000ms exceeded.

       at ../helpers/pageObjectModels/BuiltInsPage.ts:229

      227 |    */
      228 |   async waitForLoadState(state?: Parameters<Page['waitForLoadState']>[0]): Promise<void> {
    > 229 |     await this._page.waitForLoadState(state)
          |                      ^
      230 |   }
      231 |
      232 |   /**
        at BasePage.waitForLoadState (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BuiltInsPage.ts:229:22)
        at waitForNewsletterSection (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:31:14)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:71:11

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-consent-checkbox--876dc-olicy-link-opens-in-new-tab-mobile-safari/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-consent-checkbox--876dc-olicy-link-opens-in-new-tab-mobile-safari/error-context.md

  3) [mobile-safari] › test/e2e/specs/03-forms/consent-checkbox.spec.ts:136:3 › Newsletter GDPR Consent › @ready GDPR error message is displayed

    Test timeout of 30000ms exceeded while running "beforeEach" hook.

      65 |   let playwrightPage: Page
      66 |
    > 67 |   test.beforeEach(async ({ page }) => {
         |        ^
      68 |     playwrightPage = page
      69 |     pageUnderTest = await BasePage.init(page)
      70 |     await pageUnderTest.goto(HOME_PATH)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:67:8

    Error: page.waitForLoadState: Test timeout of 30000ms exceeded.

       at ../helpers/pageObjectModels/BuiltInsPage.ts:229

      227 |    */
      228 |   async waitForLoadState(state?: Parameters<Page['waitForLoadState']>[0]): Promise<void> {
    > 229 |     await this._page.waitForLoadState(state)
          |                      ^
      230 |   }
      231 |
      232 |   /**
        at BasePage.waitForLoadState (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BuiltInsPage.ts:229:22)
        at waitForNewsletterSection (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:31:14)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/consent-checkbox.spec.ts:71:11

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-consent-checkbox--b0ace--error-message-is-displayed-mobile-safari/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-consent-checkbox--b0ace--error-message-is-displayed-mobile-safari/error-context.md

  3 failed
    [mobile-safari] › test/e2e/specs/03-forms/consent-checkbox.spec.ts:82:3 › Newsletter GDPR Consent › @ready GDPR label contains privacy policy link
    [mobile-safari] › test/e2e/specs/03-forms/consent-checkbox.spec.ts:88:3 › Newsletter GDPR Consent › @ready privacy policy link opens in new tab
    [mobile-safari] › test/e2e/specs/03-forms/consent-checkbox.spec.ts:136:3 › Newsletter GDPR Consent › @ready GDPR error message is displayed

## Image generation models

- dall-e (OpenAI)
- flux pro - text-to-image and image-to-image generation, developed by Black Forest Labs, known for its exceptional speed, high visual quality, and superior prompt adherence, offering features like advanced editing, video generation, and context-aware understanding through platforms like Flux.ai, Fal.ai, and Skywork.ai. It serves as a professional-grade creative tool, balancing performance with user-friendly access for detailed content creation.
- nano banana (Google)
- sd3 (Stability AI's Stable Diffusion 3, open source)

## Content Instructions

- building-with-astro
- typescript-best-practices
- useful-vs-code-extensions
- writing-library-code
