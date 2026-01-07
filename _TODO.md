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
