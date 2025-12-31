# BasePage POM Method Usage

## Types of functions in BasePage.ts

### Utility functions

- clearConsentCookies
- enable404Listener
- reset404Errors
- themeKeyPromise
- clearCookieDialog
- closeMobileMenu
- consoleMssgPromise
- openMobileMenu
- navigateToPage
- countElements

### Getters

- getThemeKeyValue

We have getters like this in `spec` files:

```typescript
expect(firawait page.goto('/articles')
await page.waitForLoadState('networkidle')

// Find first article link
const firstArticleLink = page.locator('a[href*="/articles/"]').first()
await stArticleLink).toBeVisible()

// Navigate to the article
await page.goto(articleUrl!)
await page.waitForLoadState('networkidle')
```

### Expectations

- expectThemePickerButton

### Waiters

- waitForPageComplete
- waitForPageLoad

### Bespoke repetitive code

#### Skip if mobile viewport:

`test/e2e/specs/01-smoke/critical-paths.spec.ts`

```typescript
const viewport = playwrightPage.viewportSize()
const isMobile = viewport ? viewport.width < 768 : false
test.skip(isMobile, 'Desktop navigation test - skipping on mobile viewport')
```

## Ugly test cases

`@ready mobile navigation works across main pages` in `critical-paths.spec.ts`

## Test files with utilities that should move to POM

- 01-smoke, 02-pages, and 03-forms spec files are clean

- Files in 04-components that don't have utilities in test case, all others do:

- breadcrumbs
- footer
- markdown
- navigation-desktop

- test/e2e/specs/05-metadata/structured-data.spec.ts

has a VIEWPORTS const:

- test/e2e/specs/10-visual/responsive-layouts.spec.ts

has a setTheme function:

- test/e2e/specs/10-visual/theme-switching.spec.ts

has navigateAndAwaitHydration function:

- test/e2e/specs/12-persistence/head.spec.ts

- test/e2e/specs/14-system/environmentApi.spec.ts
- test/e2e/specs/14-system/environmentClient.spec.ts

- test/e2e/specs/14-system/package-release.spec.ts
- test/e2e/specs/14-system/privacy-policy-version.spec.ts

has navigateToDiagnosticsPage and getSnapshot:

- test/e2e/specs/14-system/siteUrlApi.spec.ts

## POM → Page/Route Mapping

### BreadCrumbPage (BreadCrumbPage.ts)

- Routes it targets: listing pages `/articles`, `/services`, `/case-studies`, then navigates to the first detail page it can find under each (e.g. ``/articles/<slug>`).

- 1:1 or 1:many: 1:many (listing + arbitrary first detail for each content type).

- Used by: `breadcrumbs.spec.ts`

### HeadPage (HeadPage.ts)

- Routes it targets: none hardcoded; it asserts head/meta/JSON-LD on whatever page you've navigated to. In the structured data suite it covers `/`, `/articles`, first `/articles/<slug>`, `/services`, first `/services/<slug>`, and `/contact`.

- 1:1 or 1:many: 1:many (generic head / structured-data helper).

- Used by: `structured-data.spec.ts`

### MarkdownPage (MarkdownPage.ts)

- Routes it targets: `/testing/markdown` (dedicated fixture page).

- 1:1 or 1:many: 1:1 (single fixture route).

- Used by: `markdown.spec.ts`

### NewsletterPage (NewsletterPage.ts)

- Routes it targets:`/testing/newsletter` (dedicated fixture page).

- Also interacts with: the action endpoint `/_actions/newsletter/subscribe` (via `waitForResponse` expectations).
1:1 or 1:many: 1:1 (single fixture route, plus the action endpoint).

- Used by: `newsletter-subscription.spec.ts`

### PwaPage (PwaPage.ts)

- Routes it targets: primarily `/` (homepage), including helpers that wait for SW readiness/caches (some of which are environment-dependent).

- 1:1 or 1:many: 1:many in capability (PWA primitives), but current coverage is 1:1 on `/`.

- Used by: `offline-mode.spec.ts`

### PerformancePage (PerformancePage.ts)

- Routes it targets: none hardcoded; in current specs it's used against `/` (homepage).
1:1 or 1:many: 1:many in design (generic perf helpers), but currently exercised as 1:1 on `/`.

- Used by:
  - `core-web-vitals.spec.ts` (goes to `/`)
  - `lighthouse.spec.ts` (goes to `/`, but tests are skipped)

### ComponentPersistencePage (ComponentPersistencePage.ts)

- Routes it targets: none hardcoded in the POM; the specs drive navigation. In practice it's used to start on `/` then navigate via Astro View Transitions to `/articles` and sometimes `/services`.

- 1:1 or 1:many: 1:many (it's a view-transitions persistence harness for whatever page contains the selector under test).

- Used by:
  - `footer.spec.ts` (navigates / → /articles)
  - `themepicker.spec.ts` (navigates / → /articles)
  - `head.spec.ts` (navigates / → /articles, /services, plus a reload back to /)

## POM Methods in BasePage.ts

### clearConsentCookies

- test/e2e/specs/01-smoke/critical-paths.spec.ts

### enable404Listener

- test/e2e/specs/01-smoke/critical-paths.spec.ts

### expectCookiesContactForm

- test/e2e/specs/01-smoke/critical-paths.spec.ts

### expectThemePickerButton

- test/e2e/specs/01-smoke/critical-paths.spec.ts

### reset404Errors

- test/e2e/specs/01-smoke/critical-paths.spec.ts

### getThemeKeyValue

- test/e2e/specs/01-smoke/homepage.spec.ts

### themeKeyPromise

- test/e2e/specs/01-smoke/homepage.spec.ts

### expectArticleCard

- test/e2e/specs/02-pages/articles.spec.ts

### expectCaseStudyCard

- test/e2e/specs/02-pages/case-studies.spec.ts

### expectLabelFor

- test/e2e/specs/02-pages/contact.spec.ts

### expectSubmitButton

- test/e2e/specs/02-pages/contact.spec.ts

### expectCtaButton

- test/e2e/specs/02-pages/homepage.spec.ts

### expectHeroSection

- test/e2e/specs/02-pages/homepage.spec.ts

### expectServiceCard

- test/e2e/specs/02-pages/services.spec.ts

### clearCookieDialog

- test/e2e/specs/04-components/footer.spec.ts

### expectElementHidden

- test/e2e/specs/04-components/navigation-desktop.spec.ts

### closeMobileMenu

- test/e2e/specs/04-components/navigation-mobile.spec.ts

### waitForPageComplete

- test/e2e/specs/07-performance/core-web-vitals.spec.ts

### consoleMssgPromise

- test/e2e/specs/12-persistence/body-visibility.spec.ts

### expectContactForm

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts

### expectContactFormEmailInput

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts

### expectContactFormGdpr

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts

### expectContactFormMessageInput

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts

### expectContactFormNameInput

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts

### expectFooter

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/04-components/footer.spec.ts

### expectNewsletterEmailInput

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts

### expectNewsletterForm

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts

### expectNewsletterGdpr

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts

### openMobileMenu

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/04-components/navigation-mobile.spec.ts

### getTextContent

- test/e2e/specs/04-components/breadcrumbs.spec.ts
- test/e2e/specs/04-components/footer.spec.ts

### expectUrl

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-studies.spec.ts

### expectElementNotEmpty

- test/e2e/specs/02-pages/article-detail.spec.ts
- test/e2e/specs/02-pages/case-study-detail.spec.ts
- test/e2e/specs/02-pages/service-detail.spec.ts

### getTitle

- test/e2e/specs/02-pages/case-study-detail.spec.ts
- test/e2e/specs/05-metadata/open-graph.spec.ts
- test/e2e/specs/05-metadata/seo-tags.spec.ts

### expectHasHeading

- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts
- test/e2e/specs/02-pages/services.spec.ts

### expectTextVisible

- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts
- test/e2e/specs/02-pages/tags.spec.ts

### expectTextContains

- test/e2e/specs/02-pages/case-studies.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/02-pages/tags.spec.ts

### expectUrlContains

- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/04-components/breadcrumbs.spec.ts
- test/e2e/specs/04-components/footer.spec.ts
- test/e2e/specs/04-components/navigation-desktop.spec.ts

### waitForHeaderComponents

- test/e2e/specs/04-components/theme-picker.spec.ts
- test/e2e/specs/11-regression/hero-animation-mobile-menu-pause.spec.ts
- test/e2e/specs/12-persistence/body-visibility.spec.ts
- test/e2e/specs/12-persistence/head.spec.ts

### expectTitle

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/01-smoke/homepage.spec.ts
- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-studies.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts
- test/e2e/specs/02-pages/services.spec.ts

### expectMainElement

- test/e2e/specs/01-smoke/homepage.spec.ts
- test/e2e/specs/01-smoke/site.spec.ts
- test/e2e/specs/02-pages/article-detail.spec.ts
- test/e2e/specs/02-pages/service-detail.spec.ts
- test/e2e/specs/06-accessibility/aria-screen-readers.spec.ts
- test/e2e/specs/06-accessibility/high-contrast-wcag-compliance.spec.ts
- test/e2e/specs/06-accessibility/wcag-compliance.spec.ts

### expectAttribute

- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-studies.spec.ts
- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/05-metadata/open-graph.spec.ts
- test/e2e/specs/05-metadata/rss-feed.spec.ts
- test/e2e/specs/05-metadata/seo-tags.spec.ts
- test/e2e/specs/09-pwa/manifest.spec.ts

### navigateToPage

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/04-components/navigation-mobile.spec.ts
- test/e2e/specs/04-components/store-persistence.spec.ts
- test/e2e/specs/04-components/theme-picker.spec.ts
- test/e2e/specs/12-persistence/body-visibility.spec.ts
- test/e2e/specs/12-persistence/footer.spec.ts
- test/e2e/specs/12-persistence/head.spec.ts
- test/e2e/specs/12-persistence/themepicker.spec.ts

### countElements

- test/e2e/specs/02-pages/article-detail.spec.ts
- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-study-detail.spec.ts
- test/e2e/specs/04-components/breadcrumbs.spec.ts
- test/e2e/specs/04-components/footer.spec.ts
- test/e2e/specs/04-components/navigation-desktop.spec.ts
- test/e2e/specs/05-metadata/open-graph.spec.ts
- test/e2e/specs/05-metadata/seo-tags.spec.ts
- test/e2e/specs/05-metadata/structured-data.spec.ts

### expectHeading

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/01-smoke/homepage.spec.ts
- test/e2e/specs/01-smoke/site.spec.ts
- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-studies.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts
- test/e2e/specs/02-pages/service-detail.spec.ts
- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/02-pages/tags.spec.ts

### waitForPageLoad

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/04-components/consentBanner.spec.ts
- test/e2e/specs/04-components/footer.spec.ts
- test/e2e/specs/04-components/navigation-mobile.spec.ts
- test/e2e/specs/04-components/store-persistence.spec.ts
- test/e2e/specs/04-components/theme-picker.spec.ts
- test/e2e/specs/12-persistence/body-visibility.spec.ts
- test/e2e/specs/12-persistence/footer.spec.ts
- test/e2e/specs/12-persistence/head.spec.ts
- test/e2e/specs/12-persistence/themepicker.spec.ts

### expectNoErrors

- test/e2e/specs/01-smoke/critical-paths.spec.ts
- test/e2e/specs/01-smoke/homepage.spec.ts
- test/e2e/specs/02-pages/article-detail.spec.ts
- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-studies.spec.ts
- test/e2e/specs/02-pages/case-study-detail.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/homepage.spec.ts
- test/e2e/specs/02-pages/service-detail.spec.ts
- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/02-pages/tags.spec.ts

### expectElementVisible

- test/e2e/specs/02-pages/article-detail.spec.ts
- test/e2e/specs/02-pages/articles.spec.ts
- test/e2e/specs/02-pages/case-studies.spec.ts
- test/e2e/specs/02-pages/case-study-detail.spec.ts
- test/e2e/specs/02-pages/contact.spec.ts
- test/e2e/specs/02-pages/service-detail.spec.ts
- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/02-pages/tags.spec.ts
- test/e2e/specs/04-components/breadcrumbs.spec.ts
- test/e2e/specs/04-components/footer.spec.ts
- test/e2e/specs/04-components/navigation-desktop.spec.ts
- test/e2e/specs/04-components/navigation-mobile.spec.ts

### getAttribute

- test/e2e/specs/01-smoke/dynamic-pages.spec.ts
- test/e2e/specs/02-pages/services.spec.ts
- test/e2e/specs/04-components/animations-computers.spec.ts
- test/e2e/specs/04-components/carousel.spec.ts
- test/e2e/specs/04-components/consentBanner.spec.ts
- test/e2e/specs/04-components/footer.spec.ts
- test/e2e/specs/04-components/icon.spec.ts
- test/e2e/specs/04-components/navigation-desktop.spec.ts
- test/e2e/specs/04-components/navigation-mobile.spec.ts
- test/e2e/specs/04-components/social-shares.spec.ts
- test/e2e/specs/04-components/testimonials.spec.ts
- test/e2e/specs/04-components/theme-picker.spec.ts
- test/e2e/specs/05-metadata/open-graph.spec.ts
- test/e2e/specs/05-metadata/rss-feed.spec.ts
- test/e2e/specs/05-metadata/seo-tags.spec.ts
- test/e2e/specs/05-metadata/structured-data.spec.ts
- test/e2e/specs/06-accessibility/aria-screen-readers.spec.ts
- test/e2e/specs/06-accessibility/keyboard-navigation.spec.ts
- test/e2e/specs/09-pwa/manifest.spec.ts
- test/e2e/specs/10-visual/theme-switching.spec.ts
- test/e2e/specs/12-persistence/head.spec.ts

Two of the 0 usage methods are actually referenced elsewhere: `dismissCookieModal` is used internally by `afterGoto`, and `getText` is used by `NewsletterPage`.
