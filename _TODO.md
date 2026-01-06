<!-- markdownlint-disable-file -->
# TODO

## Refactor E2E Test Suite

### Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18) - Needs Percy/Chromatic
Lighthouse audits (6) - Integration pending
Newsletter double opt-in (6) - Email testing infrastructure
Axe accessibility (2) - axe-core integration

### Axe tags

cat.aria: Rules related to Accessible Rich Internet Applications (ARIA) attributes and roles.
cat.color: Rules related to color contrast and meaning conveyed by color.
cat.controls: Rules for interactive controls, such as form elements and links.
cat.forms: Rules specifically for forms, form fields, and their labels.
cat.keyboard: Rules related to keyboard operability.
cat.links: Rules for links, including their names and destinations.
cat.name-role-value: Rules that check if an element has a name, role, and value that can be correctly interpreted by assistive technologies.
cat.semantics: Rules related to the semantic structure of a document, such as headings and landmarks.
cat.sensory-and-visual-cues: Rules that deal with information conveyed by sensory or visual characteristics.
cat.structure: Rules related to the document's overall structure, like the proper nesting of elements.
cat.tables: Rules for data tables, including headers and associations.
cat.text-alternatives: Rules for ensuring that text alternatives are provided for non-text content, such as images.

## Refactor Theme Colors

brand primary:    #001733
brand secondary:  #0062B6

ring (1px), ring-2, ring-4
accent

text-white, other default Tailwind colors

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

or listen for changes:

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

```bash
1) [mobile-chrome] › test/e2e/specs/01-smoke/critical-paths.spec.ts:38:3 › Critical Paths @smoke › @ready mobile navigation works across main pages

TimeoutError: page.waitForFunction: Timeout 15000ms exceeded.

    at ../helpers/pageObjectModels/BasePage.ts:263

  261 |     }
  262 |
> 263 |     await this._page.waitForFunction(
      |                      ^
  264 |       () => {
  265 |         const header = document.getElementById('header')
  266 |         const menu = document.querySelector('.main-nav-menu')
    at BasePage.openMobileMenu (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:263:22)
    at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/critical-paths.spec.ts:53:7

attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
.cache/playwright/output/01-smoke-critical-paths-Cr-fda54-ion-works-across-main-pages-mobile-chrome/test-failed-1.png
────────────────────────────────────────────────────────────────────────────────────────────────

Error Context: .cache/playwright/output/01-smoke-critical-paths-Cr-fda54-ion-works-across-main-pages-mobile-chrome/error-context.md

2) [mobile-safari] › test/e2e/specs/01-smoke/critical-paths.spec.ts:114:3 › Critical Paths @smoke › @ready main pages have no errors

Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  [[Fetch API cannot load http: /localhost:4321/offline due to access control checks.]]

    at ../helpers/pageObjectModels/BasePage.ts:665

  663 |     const errors = await this._page.pageErrors()
  664 |     const filteredErrors = errors.filter((error) => !this.isIgnorablePageError(error))
> 665 |     expect(filteredErrors).toHaveLength(0)
      |                            ^
  666 |     return filteredErrors
  667 |   }
  668 |
    at BasePage.expectNoErrors (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/BasePage.ts:665:28)
    at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/critical-paths.spec.ts:118:7

attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
.cache/playwright/output/01-smoke-critical-paths-Cr-4a53f-y-main-pages-have-no-errors-mobile-safari/test-failed-1.png
────────────────────────────────────────────────────────────────────────────────────────────────

Error Context: .cache/playwright/output/01-smoke-critical-paths-Cr-4a53f-y-main-pages-have-no-errors-mobile-safari/error-context.md

2 failed
[mobile-chrome] › test/e2e/specs/01-smoke/critical-paths.spec.ts:38:3 › Critical Paths @smoke › @ready mobile navigation works across main pages
[mobile-safari] › test/e2e/specs/01-smoke/critical-paths.spec.ts:114:3 › Critical Paths @smoke › @ready main pages have no errors



  1) [webkit] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:171:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors

Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  ["Failed to load resource: the server responded with a status of 403 (Forbidden)"]

  192 |
  193 |     // Fail if there are any unexpected 404s or errors
> 194 |     expect(errorChecker.getFilteredErrors()).toHaveLength(0)
      |                                              ^
  195 |     expect(errorChecker.getFiltered404s()).toHaveLength(0)
  196 |   })
  197 | })
    at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:194:46

attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
.cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-webkit/test-failed-1.png
────────────────────────────────────────────────────────────────────────────────────────────────

Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-webkit/error-context.md

2) [mobile-safari] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:171:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors

Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  ["Failed to load resource: the server responded with a status of 403 (Forbidden)"]

  192 |
  193 |     // Fail if there are any unexpected 404s or errors
> 194 |     expect(errorChecker.getFilteredErrors()).toHaveLength(0)
      |                                              ^
  195 |     expect(errorChecker.getFiltered404s()).toHaveLength(0)
  196 |   })
  197 | })
    at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:194:46

attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
.cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-mobile-safari/test-failed-1.png
────────────────────────────────────────────────────────────────────────────────────────────────

Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-mobile-safari/error-context.md

2 failed
[webkit] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:171:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
[mobile-safari] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:171:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
```

--color-blue-200
--color-blue-400
--color-blue-50
--color-blue-500
--color-gray-100
--color-gray-500
--color-orange-100
--color-purple-100
--color-purple-600
