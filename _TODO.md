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

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway

## POM → Page/Route Mapping

### BreadCrumbPage (BreadCrumbPage.ts)

- Routes it targets: listing pages `/articles`, `/services`, `/case-studies`, then navigates to the first detail page it can find under each (e.g. ``/articles/<slug>`).

- 1:1 or 1:many: 1:many (listing + arbitrary first detail for each content type).

- Used by: `breadcrumbs.spec.ts`

### ComponentPersistencePage (ComponentPersistencePage.ts)

- Routes it targets: none hardcoded in the POM; the specs drive navigation. In practice it's used to start on `/` then navigate via Astro View Transitions to `/articles` and sometimes `/services`.

- 1:1 or 1:many: 1:many (it's a view-transitions persistence harness for whatever page contains the selector under test).

- Used by:
    - `footer.spec.ts` (navigates / → /articles)
    - `themepicker.spec.ts` (navigates / → /articles)
    - `head.spec.ts` (navigates / → /articles, /services, plus a reload back to /)

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

### PerformancePage (PerformancePage.ts)

- Routes it targets: none hardcoded; in current specs it's used against `/` (homepage).
1:1 or 1:many: 1:many in design (generic perf helpers), but currently exercised as 1:1 on `/`.

- Used by:
    - `core-web-vitals.spec.ts` (goes to `/`)
    - `lighthouse.spec.ts` (goes to `/`, but tests are skipped)

### PwaPage (PwaPage.ts)

- Routes it targets: primarily `/` (homepage), including helpers that wait for SW readiness/caches (some of which are environment-dependent).

- 1:1 or 1:many: 1:many in capability (PWA primitives), but current coverage is 1:1 on `/`.

- Used by: `offline-mode.spec.ts`
