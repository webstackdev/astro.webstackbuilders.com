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

## Missing E2E Component Tests

- Code/CodeBlock
- Code/CodeTabs
- Consent/Checkbox

## Youtube video for Backstage IDP hero on Home page

Discuss agentic AI integrations to add to Backstage

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway
https://aws.plainenglish.io/how-to-build-a-chatbot-using-aws-lex-and-lambda-in-2026-aeeff5e13f4a

## Move Docker containers to dev server from Playwright

We should start the mock containers with the dev server instead of with Playwright so that they're useable in a dev environment.

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

- Need a workflow to generate PDF files from Markdown for downloads.

- Add a QR code at the bottom of printed pages so it's easier for someone to navigate to from a printed page.

- Need a layout alternative to Markup that formats for print. It needs to handle TOC differently as a full-width page. Need a fixed cover page format that adds article title, subtitle, and date.

- We have two print scenarios: black and white, and color for PDF output. Can use two different media queries to accomplish getting colored variables.

- Need to make sure that on print, when we have a tabbed code block with multiple languages, only the first language is printed and the other language tabs are hidden. The styling should be different for print for the code block. Maybe move other language code tabs to an appendix and add a link to them.

- Need to only load print style sheet when needed.

[Paged.js](https://pagedjs.org/en/documentation/) polyfills `@page` properties, and lays out an HTML document in print format where it can have page numbers generated to update in a table of contents.

[This article](https://excessivelyadequate.com/posts/print.html) shows how to control the following properties in Chrome's Print Properties dialog box from CSS: Layout, Paper size, Margins, Headers and footers, and Background graphics. Headers and footers is the checkbox that by default is enabled and adds information on printed pages. It also shows how to use Chrome from the terminal in headless mode to output a PDF file from an HTML page.

This article has different approaches to [print pagination](https://www.customjs.space/blog/html-print-pagination-footer/). One approach overlaps with PagedJS's approach.

## ToolTips

Need a tooltip component for consistency. List to add tooltips to:

- Themepicker button
- Search button
- Abbreviations in markdown
- "Report a Bug" in footer
- RSS feed icon in footer

## Support Pages to Style

- /404 (should show search results based on query)
- /search
- Bug reporter modal
- Email templates

## HubSpot Signup Issues

- Add people who sign up for newsletter, download, or fill out contact form to Hubspot tracking. Need to configure it to remove them if they do the GDPR remove me. Also remove them from the newsletter.

## Downloads / Gated Content

- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading. If a reader has already given their email address - newsletter signup, contact form, download registration, then the download CTA on short form articles should go directly to the HTML version of the deep dive, and it should have a PDF download button.

- Make `/deep-dive/` SSR loaded so we can check if they've given their e-mail address.

- If they haven't and they get to the path from sharing a link or something, we should use the `index.astro` file in that directory to explain that they've accessed gated content, and ask for their e-mail address. Then redirect to the content they want when they give it.

- If they've given their email link, the content switcher button to switch should be enabled.

- We had this copyright statement for articles, it should be in the front matter of PDFs:

```text
Copyright © 2025 Webstack Builders, Inc.
The text, diagrams, and images in this work are licensed under CC BY-NC 4.0
All code samples in this article are licensed under the MIT License. Feel free to use, modify, and distribute them in any project.
```

- When someone's already given their email address, the Download CTA should just have a download button - not require them to sign up again

## Search

- How do we handle the keywords in the long form / pdf files from a search perspective? Can we return the result in the search results if the short form content is not returned in the search results, and highlight it somehow in the search results to show that it is gated content? And clicking on its link takes the user to the Download page for that item?

## Theming and improving Mermaid diagrams

[rerender diagrams when I switched color-scheme](https://github.com/mermaid-js/mermaid/issues/1945)
[mermaid init](https://github.com/hbstack/mermaid/blob/main/assets/hb/modules/mermaid/init.ts)
[theming](https://mermaid.ai/open-source/config/theming.html)

https://mermaid.js.org/config/theming.html
https://mermaid.js.org/config/directives.html

## Todo

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

- Uppy, Tus server, whatever other server needed for file upload on Contact Form component

- Add Inset component and convert `text` code blocks to use it.

- Only needed if images used in content: Use an in-project Image component to wrap Astro's Image and Picture. Show a magnifying glass with a "+" for the cursor on hover, and a modal to show a magnified view of images on click.

- Focus-visible / active handling on ToC nav items

- Style "Share to Mastodon" modal in src/components/Social/Mastodon/client/index.ts

- There's a pretty long delay when you push the Content Switcher to go from short to deep dive, what's causing it? It should be fast - maybe it's a prefetch issue, prefetch on page load

- Suggestions on improving table layout for better visual experience. Consider adding a trim outline to tables

- Cap callout length at 80% or 90% of the column so they're not longer than any text

- Themepicker and search icon are too big in non-squished header. Logo too - the initial presentation should be smaller.

- Search box in header should have blue outline, not highlight

- Contact page Uppy file upload not displaying. Submit button is huge on Contact page.

- Hero animation not loading on home page.

- Improve `<abbr>` styling: https://codepen.io/ire/pen/NoqWpm

## List Component

- Task list checked variant Markdown in dark theme is awkward, it has a dark shadow

- 'three-column-icon-list' List layout is broken in dark theme

- 'two-column-icon-list' List layout looks bad on dark theme. The bgColor looks good on light theme, but awkward on dark theme.

## Header

- Need to improve the "squish" animation where the header reduces in size on scroll down, and returns to full size on scroll up. Maybe reduce and expand the text and search / themepicker / hamburger menu sizes in place, and then slide them horizontally.

## Content Issues

- "### Geographic/Currency Mismatches" in deep-dive/cdn-edge-caching-cache-keys-vary-headers has a table -> callout -> table back to back

- Need an article on OpenStack

- Add a Social Share on some compelling text in each article

- Home page reorganization: move the "What I Deliver" box from the Hero into the Backstage image. Move the Backstage image / video to the hero.

- Determine if any of the python code blocks should have `#!/bin/python` added

- Need a Q & A format to use in `blameless-postmortem-incident-analysis-systemic-causes`. Might be one of the list formats.

- We need to check for short form and deep article articles where the deep-dive index.pdf has a non-featured tag like "argo-cd" only in the pdf.mdx. In those cases, we should make sure the callout for the deep dive includes the name of that non-featured (technology) tag
