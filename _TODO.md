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

## Content Redo - Tag Groups

- Platform Engineering
- DevOps
- Kubernetes
- Infrastructure as Code
- Containers
- API Management
- SRE

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

## Playwright 01-smoke errors

```bash
1) [firefox] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors

  Error: Unexpected console errors:

    - http://localhost:4321/articles/typescript-best-practices:0:1 [JavaScript Error: "Loading module from "http://localhost:4321/node_modules/.vite/deps/lit_directives_if-defined__js.js?v=02d3d067" was blocked because of a disallowed MIME type ("")." {file: "http://localhost:4321/articles/typescript-best-practices" line: 0}]

  expect(received).toHaveLength(expected)

  Expected length: 0
  Received length: 1
  Received array:  ["http://localhost:4321/articles/typescript-best-practices:0:1 [JavaScript Error: \"Loading module from "http://localhost:4321/node_modules/.vite/deps/lit_directives_if-defined__js.js?v=02d3d067" was blocked because of a disallowed MIME type ("").\" {file: \"http://localhost:4321/articles/typescript-best-practices\" line: 0}]"]

    247 |         ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
    248 |         : undefined
  > 249 |     ).toHaveLength(0)
        |       ^
    250 |
    251 |     expect(
    252 |       filtered404s,
      at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:249:7

  attachment #1: console-errors (text/plain) ─────────────────────────────────────────────────────
  http://localhost:4321/articles/typescript-best-practices:0:1 [JavaScript Error: "Loading module from "http://localhost:4321/node_modules/.vite/deps/lit_directives_if-defined__js.js?v=02d3d067" was blocked because of a disallowed MIME type ("")." {file: "http://localhost:4321/articles/typescript-best...
  ────────────────────────────────────────────────────────────────────────────────────────────────

  attachment #2: screenshot (image/png) ──────────────────────────────────────────────────────────
  .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-firefox/test-failed-1.png
  ────────────────────────────────────────────────────────────────────────────────────────────────

  Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-firefox/error-context.md

2) [webkit] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors 

  Error: Unexpected console errors:

    - https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)

  expect(received).toHaveLength(expected)

  Expected length: 0
  Received length: 1
  Received array:  ["https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)"]

    247 |         ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
    248 |         : undefined
  > 249 |     ).toHaveLength(0)
        |       ^
    250 |
    251 |     expect(
    252 |       filtered404s,
      at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:249:7

  attachment #1: console-errors (text/plain) ─────────────────────────────────────────────────────
  https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)
  ────────────────────────────────────────────────────────────────────────────────────────────────

  attachment #2: screenshot (image/png) ──────────────────────────────────────────────────────────
  .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-webkit/test-failed-1.png
  ────────────────────────────────────────────────────────────────────────────────────────────────

  Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-webkit/error-context.md

3) [mobile-safari] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors 

  Error: Unexpected console errors:

    - https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)

  expect(received).toHaveLength(expected)

  Expected length: 0
  Received length: 1
  Received array:  ["https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)"]

    247 |         ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
    248 |         : undefined
  > 249 |     ).toHaveLength(0)
        |       ^
    250 |
    251 |     expect(
    252 |       filtered404s,
      at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:249:7

  attachment #1: console-errors (text/plain) ─────────────────────────────────────────────────────
  https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)
  ────────────────────────────────────────────────────────────────────────────────────────────────

  attachment #2: screenshot (image/png) ──────────────────────────────────────────────────────────
  .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-mobile-safari/test-failed-1.png
  ────────────────────────────────────────────────────────────────────────────────────────────────

  Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-mobile-safari/error-context.md

3 failed
  [firefox] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
  [webkit] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
  [mobile-safari] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors

### Run #2:

  1) [firefox] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors 

    Error: Unexpected console errors:

      - http://localhost:4321/articles/typescript-best-practices:0:1 [JavaScript Error: "Loading module from “http://localhost:4321/node_modules/.vite/deps/lit_directives_if-defined__js.js?v=02d3d067” was blocked because of a disallowed MIME type (“”)." {file: "http://localhost:4321/articles/typescript-best-practices" line: 0}]

    expect(received).toHaveLength(expected)

    Expected length: 0
    Received length: 1
    Received array:  ["http://localhost:4321/articles/typescript-best-practices:0:1 [JavaScript Error: \"Loading module from “http://localhost:4321/node_modules/.vite/deps/lit_directives_if-defined__js.js?v=02d3d067” was blocked because of a disallowed MIME type (“”).\" {file: \"http://localhost:4321/articles/typescript-best-practices\" line: 0}]"]

      247 |         ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
      248 |         : undefined
    > 249 |     ).toHaveLength(0)
          |       ^
      250 |
      251 |     expect(
      252 |       filtered404s,
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:249:7

    attachment #1: console-errors (text/plain) ─────────────────────────────────────────────────────
    http://localhost:4321/articles/typescript-best-practices:0:1 [JavaScript Error: "Loading module from “http://localhost:4321/node_modules/.vite/deps/lit_directives_if-defined__js.js?v=02d3d067” was blocked because of a disallowed MIME type (“”)." {file: "http://localhost:4321/articles/typescript-best...
    ────────────────────────────────────────────────────────────────────────────────────────────────

    attachment #2: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-firefox/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-firefox/error-context.md

  2) [webkit] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors

    Error: Unexpected console errors:

      - https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)

    expect(received).toHaveLength(expected)

    Expected length: 0
    Received length: 1
    Received array:  ["https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)"]

      247 |         ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
      248 |         : undefined
    > 249 |     ).toHaveLength(0)
          |       ^
      250 |
      251 |     expect(
      252 |       filtered404s,
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:249:7

    attachment #1: console-errors (text/plain) ─────────────────────────────────────────────────────
    https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)
    ────────────────────────────────────────────────────────────────────────────────────────────────

    attachment #2: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-webkit/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-webkit/error-context.md

  3) [mobile-safari] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors

    Error: Unexpected console errors:

      - https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)

    expect(received).toHaveLength(expected)

    Expected length: 0
    Received length: 1
    Received array:  ["https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)"]

      247 |         ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
      248 |         : undefined
    > 249 |     ).toHaveLength(0)
          |       ^
      250 |
      251 |     expect(
      252 |       filtered404s,
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/01-smoke/dynamic-pages.spec.ts:249:7

    attachment #1: console-errors (text/plain) ─────────────────────────────────────────────────────
    https://va.vercel-scripts.com/v1/script.debug.js:0:0 Failed to load resource: the server responded with a status of 403 (Forbidden)
    ────────────────────────────────────────────────────────────────────────────────────────────────

    attachment #2: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-mobile-safari/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/01-smoke-dynamic-pages-Dyn-8a015-ages-have-no-console-errors-mobile-safari/error-context.md

  3 failed
    [firefox] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
    [webkit] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
    [mobile-safari] › test/e2e/specs/01-smoke/dynamic-pages.spec.ts:204:3 › Dynamic Pages @smoke › @ready dynamic pages have no console errors
```

```bash
### 03-forms:

  1) [firefox-serial] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:77:3 › Newsletter Subscription Form › @ready submit button shows loading state

    TimeoutError: page.waitForFunction: Timeout 2000ms exceeded.

       at ../helpers/pageObjectModels/NewsletterPage.ts:167

      165 |    */
      166 |   async waitForSpinnerLoadingState(timeout = wait.quickAssert): Promise<void> {
    > 167 |     await this.page.waitForFunction(
          |                     ^
      168 |       selector => {
      169 |         const spinner = document.querySelector(selector)
      170 |         if (!(spinner instanceof SVGElement)) {
        at NewsletterPage.waitForSpinnerLoadingState (/home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/helpers/pageObjectModels/NewsletterPage.ts:167:21)
        at /home/kevin/Repos/WebstackBuilders/CorporateWebsite/astro.webstackbuilders.com/test/e2e/specs/03-forms/newsletter-subscription.spec.ts:104:28

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    .cache/playwright/output/03-forms-newsletter-subscr-ef7bd--button-shows-loading-state-firefox-serial/test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: .cache/playwright/output/03-forms-newsletter-subscr-ef7bd--button-shows-loading-state-firefox-serial/error-context.md

  1 failed
    [firefox-serial] › test/e2e/specs/03-forms/newsletter-subscription.spec.ts:77:3 › Newsletter Subscription Form › @ready submit button shows loading state
```

## Optimizations worth doing before the styling refresh (prioritized)

### Make "ownership" of global element styling unambiguous

- Pick exactly one place for default link styling (recommend: keep it in typography.css or a dedicated "base elements" file, and remove it from reset.css).

- Same idea for body defaults: avoid defining "design" twice across reset/typography.

### Adopt a simple specificity budget + enforce it

- Goal: most selectors should be one class deep (or :where(.scope) a style), and avoid ID-based state selectors in component CSS.

- The moment you need !important, treat it as a smell (except print + vendor CSS).

### Normalize focus styling around :focus-visible

- Centralize focus ring rules so nav, forms, and global anchors don't fight each other.

- Reduce/remove "outline none" patterns in interactive contexts (especially in the mobile nav) unless you're replacing it with an equivalent visible focus style.

### Decouple nav "open/closed" from #header.aria-expanded-true

- Keep the state on the component root with a data attribute (e.g. data-expanded="true") and target that.

- This will dramatically reduce selector complexity in menu.module.css and eliminate a bunch of !important needs.

### Replace nth-child transition delays with a CSS variable or per-item inline style

- Right now the mobile nav has a long series of selectors for delays; it's correct but brittle.

- A small convention like style="--item-index: 3" + transition-delay: calc(var(--item-index) * 50ms) reduces selector count and makes menu reorderings safe.

### Define "vendor islands" explicitly

- Keep Uppy (and other third-party CSS) clearly scoped and treated as "don't refactor unless necessary".

- This prevents stylelint rule changes / cascade changes from turning into unexpected vendor regressions.

### Decide on one layering strategy and stick to it

- You're already using @layer in places (good). The pre-refresh win is ensuring global rules that must be predictable (base elements, utilities) live in predictable layers, and "random plain CSS" doesn't accidentally end up winning/losing due to import order.

### Add a short "CSS structure" doc

- 1 page: "where to put base element rules, where tokens live, when to use CSS modules vs Tailwind utilities, when !important is allowed".

- This pays off during a styling refresh more than almost anything else.


Aggressive CSS Pre-Refresh Checklist (no implementation yet)

1) Codify CSS Structure (so future edits stay consistent)

  Add a short CSS architecture doc: docs/CSS_STRUCTURE.md

    Define: where tokens live (theme-inline + per-theme), what belongs in global CSS vs component CSS modules vs Tailwind utilities, and when !important is allowed (print + vendor only).

    Define: a specificity budget (prefer 1 class selector; avoid IDs; avoid chaining state across unrelated roots).

    Define: layering rules and file ownership (what "reset" is allowed to do vs "typography" vs "focus").

2) Fix Cascade/Layers at the Root (so you stop fighting import order)

  Restructure layering and import order in index.css

  Establish an explicit layer order once (example target order: reset → base → components → utilities).

  Ensure Tailwind's layers load first, then your overrides load after, so "base element rules" are predictable.

  Keep theme tokens available to Tailwind (@theme inline in theme-inline.css + theme files) while still allowing post-Tailwind overrides.

  Practical approach to make this low-risk:

    Split global CSS into "pre-tailwind tokens" vs "post-tailwind overrides" (even if just via import order) so you're not relying on unlayered rules winning accidentally.

3) Make Global Element Styling Single-Source (links + body defaults)

  Remove duplicate global link styling from reset.css

    Delete the a { … } + a:hover, a:focus { … } blocks there.

  Consolidate link defaults into one place (recommended: typography.css)

    Put all default link behavior together: base color, underline style, underline color, hover/focus-visible behavior, underline offset.

    Keep exceptions scoped (e.g., .anchor-link rules in general.css can continue to override without needing !important).

4) Normalize Focus Strategy Around :focus-visible (reduce conflicts + mobile weirdness)

  Update focus rules in focus.css

    Change a:focus, button:focus, etc. to :focus-visible equivalents.

    Remove [tabindex='-1']:focus { outline: none !important; } and replace with a non-!important rule that only suppresses non-visible focus (example target behavior: allow programmatic focus without a ring, but keep keyboard focus rings).

  Audit and remove "focus suppression" utilities in components where they fight global focus rules

    Start with the nav link class list in Menu.astro (it currently includes focus:outline-0).

5) Navigation: Remove ID-Coupled State + Kill !important

  Change the "nav open" state mechanism in index.ts

    Stop toggling aria-expanded-true on #header (this.header.classList.toggle(...)).

    Instead, toggle a state attribute on the component itself (e.g., on <site-navigation …>), so styles don't depend on #header at all.

  Update selectors accordingly in selectors.ts

   needing a hard dependency on #header as the styling root for "menu open".

  Refactor CSS to target the component root state, not global IDs in menu.module.css

    Replace selectors like :global(#header.aria-expanded-true) … with something scoped to site-navigation[data-…] ….

    Remove !important rules used purely to win specificity battles (keep any that are truly unavoidable, but aim for zero here).

  Replace the nth-child transition-delay ladder in menu.module.css

    Use a CSS variable per item (set in markup) so reordering menu items doesn't require CSS edits.

    Apply that markup change in Menu.astro.

6) ThemePicker: Remove hidden + !important Dependency

  Replace the hidden attribute override in themePicker.module.css

    Today it forces [hidden] { display: block !important; } to support animation.

    Target: use a component state class/attribute (e.g., collapsed/open) and animate without fighting the UA hidden behavior.

  Update the state toggling logic in index.ts

    Move from "override hidden via CSS" → "explicit open/closed state + aria-hidden" (keep accessibility semantics intact).

7) Audit Remaining !important and Decide Which Bucket Each Belongs In

  Acceptable buckets:

    Print rules in print.css

    Vendor CSS (example: Uppy under contact form)

  Needs refactor (not vendor/print):

    Navigation CSS in menu.module.css

    ThemePicker CSS in themePicker.module.css

    Focus suppression in focus.css

8) Tighten Stylelint to Protect the New Structure

Update stylelint.config.mjs

  Add/enable rules that enforce the "aggressive" goals:

    discourage ID selectors in component styles

    cap specificity / disallow long selector chains

    flag new !important except in allowed paths (print/vendor)

  Add explicit ignore/allow lists for vendor CSS files so you don't fight upstream code.

9) Verification Steps (so refactor doesn't regress mobile)

  After the layering/import work: run npm run lint:style and npm run check.

  After nav refactor: run the nav unit tests under index.spec.ts.

  After focus/link changes: run the smoke tests subset you already use (CI=1 FORCE_COLOR=1 npx playwright test 01-smoke) and confirm no new "outline missing / keyboard trap" regressions.