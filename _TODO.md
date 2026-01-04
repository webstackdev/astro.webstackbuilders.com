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

1. Firefox/WebKit locator.setChecked(...) “did not change its state”

With your markup, the checkbox is sr-only and the visual switch is a separate element (peer-based). In Firefox/WebKit, a forced click on a clipped/visually-hidden checkbox can “click” without producing the native toggle behavior Playwright expects (or the component’s JS is not wired to the checkbox click in a way that actually flips the DOM checked state).

Most deterministic alternatives (conceptually):

- Don’t uncheck via the hidden input. Use the “Deny All” control (it exists as #consent-deny-all), then click “Allow All”, then assert all are checked. This tests the same behavior (“Allow All enables every category”) without the fragile intermediate toggle interaction.

- If you truly need to uncheck just one category, do it by setting state via JS (checked = false + dispatch input/change) because that bypasses the click/geometry issues and targets the state machine the component is likely listening to.

2. mobile-safari consent banner: waitForPageLoad() still times out (15s)

Important observation: in consentBanner.spec.ts, you already wait on a much more direct readiness signal right after waitForPageLoad():

consent-banner.isInitialized === true
So the likely story here is: waitForPageLoad() is unnecessary for these tests, and when it flakes it blocks the entire suite.

3. mobile-safari store persistence beforeEach timeouts + Edge footer page.goto('/') timeouts

These are pure navigation-level failures (timeouts in page.goto or in a beforeEach that presumably can’t get through its startup navigation). The usual causes are:

a global readiness wait that never resolves (which can cascade into beforeEach timing out)

- Two questions so we pick the right fixes

For the consent “Allow All enables every category” test: are you okay with changing the test to use #consent-deny-all instead of unchecking a single toggle (still verifies Allow All enables everything, but avoids the hidden-switch interaction entirely)?

For the navigation timeouts (mobile-safari + Edge): were these runs executed while npm run dev was definitely running and stable, or is it possible the server wasn’t up / got interrupted?

