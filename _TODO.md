<!-- markdownlint-disable-file -->
# TODO

## Visual Regression Testing

Playwright's Built-in Visual Testing

Playwright has a built-in visual comparison feature using await expect(page).toHaveScreenshot().

How it works: On the first run, Playwright saves a baseline screenshot. Subsequent runs compare the actual screenshot to this baseline, failing the test if there are pixel differences.

Pros: It's free, everything stays local (no third-party services needed), setup is simple, and you retain full control over the baseline images in your repository.

Cons: Browser rendering can be inconsistent across different operating systems and machines, leading to "flaky" tests or false positives. Managing baselines for multiple browsers and resolutions manually can also be challenging at scale.

## E2E

 56 …omium] › test/e2e/specs/02-pages/contact.spec.ts:15:3 › Contact Page › @ready hero section displays (5.3s)

 70 …test/e2e/specs/02-pages/homepage.spec.ts:25:3 › Homepage › @ready featured services section renders (5.5s)

 85 …st/e2e/specs/02-pages/services.spec.ts:21:3 › Services List Page › @ready services section displays (5.3s)

 93 [chromium] › test/e2e/specs/02-pages/tags.spec.ts:15:3 › Tags Index Page › @ready tag list displays (6.0s)

100 …nsent-checkbox.spec.ts:89:3 › Newsletter GDPR Consent › @ready privacy policy link opens in new tab (6.6s)

117 …ubscription.spec.ts:28:3 › Newsletter Subscription Form › @ready form rejects invalid email format (373ms)

134 …nts/breadcrumbs.spec.ts:22:3 › Breadcrumbs Component › @ready breadcrumbs display on service pages (305ms)

156 …5:3 › Consent Preferences Component › @containers full stack consent submission hits backend mocks (30.0s)

163 …2e/specs/04-components/footer.spec.ts:30:3 › Footer Component › @ready footer has copyright notice (421ms)

172 …ponents/icon.spec.ts:38:3 › Icon Component › default variant renders every local icon exactly once (30.1s)

204 …/navigation-mobile.spec.ts:232:3 › Mobile Navigation › @ready can navigate to page from mobile menu (6.0s)

219 …ares.spec.ts:46:3 › Social Shares Component › renders social share component inside testing fixture (5.3s)

257 …› Theme Picker Component › System Preferences › @ready respects prefers-color-scheme on first visit (1.2s)

361 …ility/aria-screen-readers.spec.ts:232:3 › ARIA and Screen Readers › @ready page has exactly one h1 (16.7s

397 …/12-performance/lighthouse.spec.ts:9:3 › Lighthouse Performance › run Lighthouse audit on homepage (14.5s)

653 …ares.spec.ts:46:3 › Social Shares Component › renders social share component inside testing fixture (5.5s)

663 …Nanostore Persistence Across Navigation › @ready theme preference persists across View Transitions (30.2s)

795 …ility/aria-screen-readers.spec.ts:232:3 › ARIA and Screen Readers › @ready page has exactly one h1 (10.8s)

## Missing E2E Component Tests

- BugReporter
- Calendar
- Code/CodeBlock
- Code/CodeTabs
- Consent/Checkbox
- Diagram
- FileExplorer
- Inset
- Time
- Troubleshooter

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Print

- Improve print layout by hiding header and footer for articles, add tracking

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

- Add a QR code at the bottom of printed pages so it's easier for someone to navigate to from a printed page.

- Need a layout alternative to Markup that formats for print. It needs to handle TOC differently as a full-width page. Need a fixed header format that adds article title, subtitle, and date.

- Need to make sure that on print, when we have a tabbed code block with multiple languages, only the first language is printed and the other language tabs are hidden. The styling should be different for print for the code block. Maybe move other language code tabs to an appendix and add a link to them.

[This article](https://excessivelyadequate.com/posts/print.html) shows how to control the following properties in Chrome's Print Properties dialog box from CSS: Layout, Paper size, Margins, Headers and footers, and Background graphics. Headers and footers is the checkbox that by default is enabled and adds information on printed pages. It also shows how to use Chrome from the terminal in headless mode to output a PDF file from an HTML page.

For printed pages, your header should shift from a navigation tool to a document identifier. Since users cannot click links or icons on paper, these elements are "cruft" that waste space and ink.

1. Recommended Print Header Format

A professional print header typically includes only these three elements:

- Brand Identity: A high-contrast version of your logo or the site name in plain text for brand recognition.
- Document Title: The main title of the page (usually the <h1>), ensuring the reader knows exactly what the document is.
- Source URL: A small, plain-text URL so the reader can find the live version later.

2. Elements to Remove

Hide any interactive or screen-specific components using display: none; in your @media print block:

- Navigation Menus: All top-level and dropdown links.
- Search Icons/Bars: These are non-functional on paper.
- Breadcrumbs: While useful on-screen for site hierarchy, they often look like cluttered, disconnected text on paper. Most designers remove them to keep the focus on the primary content.
- Social Media & CTA Buttons: "Sign In" or "Follow Us" buttons are irrelevant in print.

3. Expand External Links For Print:

We can't (yet) directly interface with a printed page to explore links, so link URLs should be visible on the printed version of the Web page. To keep the page relatively clean, I prefer to expand only outbound links in articles, and suppress internal ones. If you've used relative URLs on your website for local links, you can easily do this through an attribute selector and `:after` pseudo classes, thus preventing internal links and links around images from being printed:

```css
@media print {
   article a {
      font-weight: bolder;
      text-decoration: none;
   }

   article a[href^=http]:after {
      content:" <" attr(href) "> ";
   }
}
```

## PDF File Generation

- Need a workflow to generate PDF files from Markdown for downloads.

- Need a fixed cover page format that adds article title, subtitle, and date.

- Table of Contents (Workarounds)

Because the browser doesn't know which page an element (like an <h1>) will land on until the PDF is fully rendered, you cannot generate a TOC with correct page numbers in a single pass. Common workarounds include:

Paged.js Polyfill: Use the Paged.js library to handle sophisticated print layouts (like TOCs and cross-references) within the browser before Puppeteer "prints" the result.

[Paged.js](https://pagedjs.org/en/documentation/) polyfills `@page` properties, and lays out an HTML document in print format where it can have page numbers generated to update in a table of contents.

This article has different approaches to [print pagination](https://www.customjs.space/blog/html-print-pagination-footer/). One approach overlaps with PagedJS's approach.

- Headers and Footers (Native Support)

Puppeteer can inject dynamic data into your headers and footers using specific CSS classes. To use this, you must set `displayHeaderFooter: true` in the `page.pdf()` options.

Dynamic Classes: Puppeteer automatically replaces these classes with actual values:
`.pageNumber`: Current page number.
`.totalPages`: Total number of pages.
`.title`: The document's `<title>` tag.
`.date`: The date the PDF was generated.

Requirements: You must provide sufficient margins (e.g.,` margin: { top: '50px', bottom: '50px' }`), or the headers/footers will be hidden behind the content.

Styling: You must use inline CSS within your `headerTemplate` or `footerTemplate` strings, as they cannot access your external stylesheet.

## ToolTips

Need a tooltip component for consistency.

List to add tooltips to:

- Themepicker button
- Search button

These have tooltips, how are they being generated?

- "Report a Bug" in footer
- RSS feed icon in footer

## Abbreviation Styling

- Improve `<abbr>` styling: https://codepen.io/ire/pen/NoqWpm

## HubSpot Signup Issues

- Add people who sign up for newsletter, download, or fill out contact form to Hubspot tracking. Need to configure it to remove them if they do the GDPR remove me. Also remove them from the newsletter.

## Downloads / Gated Content

- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading. If a reader has already given their email address - newsletter signup, contact form, download registration, then the download CTA on short form articles should show the PDF download button instead of trying to collect email addresses again.

- We had this copyright statement for articles, it should be in the front matter of PDFs:

```text
Copyright © 2025 Webstack Builders, Inc.
The text, diagrams, and images in this work are licensed under CC BY-NC 4.0
All code samples in this article are licensed under the MIT License. Feel free to use, modify, and distribute them in any project.
```

## Youtube video for Backstage IDP hero on Home page

Discuss agentic AI integrations to add to Backstage

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway
https://aws.plainenglish.io/how-to-build-a-chatbot-using-aws-lex-and-lambda-in-2026-aeeff5e13f4a

## Move Docker containers to dev server from Playwright

We should start the mock containers with the dev server instead of with Playwright so that they're useable in a dev environment.

## Link Validator

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

## Contact Page File Uploads

- Uppy, Tus server, whatever other server needed for file upload on Contact Form component
- Contact page Uppy file upload not displaying. Submit button is huge on Contact page.

## Header - "Squish" Effect

- Need to improve the "squish" animation where the header reduces in size on scroll down, and returns to full size on scroll up. Maybe reduce and expand the text and search / themepicker / hamburger menu sizes in place, and then slide them horizontally.
- Moving the scroll bar up quickly with the mouse seems to make the header logic break - the Switcher component and Breadcrumbs are hidden under the header
- Themepicker and search icon are too big in non-squished header. Logo too - the initial presentation should be smaller.

## Content Issues

- Need an article on OpenStack

- Home page reorganization: move the "What I Deliver" box from the Hero into the Backstage image. Move the Backstage image / video to the hero.

- Add a "Preview Special" item to our Download CTA that lets the user know the Deep Dive content can be previewed in HTML format, and offer a switch to it.
