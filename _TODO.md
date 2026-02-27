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

## Move containers to dev server from Playwright

We should start the mock containers with the dev server instead of with Playwright so that they're useable in a dev environment.

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

## Search Box

- Show article titles only in drop-down search result box, and dedupe results

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

## Theming and improving Mermaid diagrams

[rerender diagrams when I switched color-scheme](https://github.com/mermaid-js/mermaid/issues/1945)
[mermaid init](https://github.com/hbstack/mermaid/blob/main/assets/hb/modules/mermaid/init.ts)
[theming](https://mermaid.ai/open-source/config/theming.html)

https://mermaid.js.org/config/theming.html
https://mermaid.js.org/config/directives.html

## Todo

- See comp images in Breadcrumbs component directory for visual improvements

- Add Inset component and convert `text` code blocks to use it.

- Need a Q & A format to use in `blameless-postmortem-incident-analysis-systemic-causes`. Might be one of the list formats.

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

- Add people who sign up for newsletter, download, or fill out contact form to Hubspot tracking. Need to configure it to remove them if they do the GDPR remove me. Also remove them from the newsletter.

- Uppy, Tus server, whatever other server needed for file upload on Contact Form component

- Use an in-project Image component to wrap Astro's Image and Picture. Show a magnifying glass with a "+" for the cursor on hover, and a modal to show a magnified view of images on click.

- Add a copyright notice to content

- Time in prose is causing a line break, and the colon and minutes to be removed - "2:47 AM" in `src/content/articles/mtls-certificate-rotation-service-mesh-authentication/pdf.mdx`. Times like "11:59:59" are breaking across two lines - `src/content/articles/rate-limiting-token-bucket-leaky-bucket-implementation/index.mdx` in "Algorithm Overview" section

- We need to exclude "Footnotes" from the ToC list of links. Right now it shows at the bottom if there's a Footnotes H2 (footnotes in the article).

- If a reader has already given their email address - newsletter signup, contact form, download registration, then the download CTA on short form articles should go directly to the HTML version of the deep dive, and it should have a PDF download button. Think this workflow through - maybe a "Short / Deep-Dive" slider button on top and don't show the CTA + the PDF download button.

- The articles list page should show tags at top for quick navigation. Show the count of articles per tag unless they're all the same on the tag.

- Update EXIF data on all AI generated JPGs

- Details dd / dt in Markdown need bottom margin

- Highlighter component in Markdown needs better colors in dark theme. It's spotlight color with content text - and there's not much contrast in dark theme between the yellow and white text.

- 'three-column-icon-list' List layout is broken in dark theme

- 'two-column-icon-list' List layout looks bad on dark theme. The bgColor looks good on light theme, but awkward on dark theme.

- Font size on GitHub Gist embed is too small

- Task list checked variant Markdown in dark theme is awkward, it has a dark shadow

- Contact Callout looks awkward in dark theme and needs redone generally

- Download icon on Download Component isn't picking up correct color on dark theme

- Newsletter component "home" and "page" variants needs work on spacing, "home" needs image added

- Determine if any of the python code blocks should have `#!/bin/python` added

## Header

- Need to improve the "squish" animation where the header reduces in size on scroll down, and returns to full size on scroll up. Maybe reduce and expand the text and search / themepicker / hamburger menu sizes in place, and then slide them horizontally.

- The right-hand browser vertical scroll bar is hidden under the header

## Print

- Need a workflow to generate PDF files from Markdown for downloads.

- Add a QR code at the bottom of printed pages so it's easier for someone to navigate to from a printed page.

- Need a layout alternative to Markup that formats for print. It needs to handle TOC differently as a full-width page. Need a fixed cover page format that adds article title, subtitle, and date.

- We have two print scenarios: black and white, and color for PDF output. Can use two different media queries to accomplish getting colored variables.

- Generate mermaid graphs for PDF from AI image generator to improve looks.

- Need to make sure that on print, when we have a tabbed code block with multiple languages, only the first language is printed and the other language tabs are hidden. The styling should be different for print for the code block. Maybe move other language code tabs to an appendix and add a link to them.

- Need to only load print style sheet when needed.

[Paged.js](https://pagedjs.org/en/documentation/) polyfills `@page` properties, and lays out an HTML document in print format where it can have page numbers generated to update in a table of contents.

[This article](https://excessivelyadequate.com/posts/print.html) shows how to control the following properties in Chrome's Print Properties dialog box from CSS: Layout, Paper size, Margins, Headers and footers, and Background graphics. Headers and footers is the checkbox that by default is enabled and adds information on printed pages. It also shows how to use Chrome from the terminal in headless mode to output a PDF file from an HTML page.

This article has different approaches to [print pagination](https://www.customjs.space/blog/html-print-pagination-footer/). One approach overlaps with PagedJS's approach.

## Downloads / Gated Content

- We can add a path like `/articles/pdf` or `/articles/deep-dive` for the long-form articles. Make that path SSR loaded so we can check if they've given their e-mail address.

- If they haven't and they get to the path from sharing a link or something, we should use the `index.astro` file in that directory to explain that they've accessed gated content, and ask for their e-mail address. Then redirect to the content they want when they give it.

- If they've given their email link, both the regular article and the deep dive should have a button to switch between the two versions so they don't have to download the PDF version.

- How do we handle the keywords in the long form / pdf files from a search perspective? Can we return the result in the search results if the short form content is not returned in the search results, and highlight it somehow in the search results to show that it is gated content? And clicking on its link takes the user to the Download page for that item?

- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading. If they've already given their e-mail address, they should be able to download it immediately.

## Content Issues

- "### Geographic/Currency Mismatches" in src/content/articles/cdn-edge-caching-cache-keys-vary-headers/index.mdx

- cover.jpg for reliability-and-testing needs touch up in GIMP

- We need to check for short form and deep article articles where the deep-dive index.pdf has a non-featured tag like "argo-cd" only in the pdf.mdx. In those cases, we should make sure the callout for the deep dive includes the name of that non-featured (technology) tag and add the name to the tags: frontmatter key in the index.mdx

- Need an article on OpenStack

- Add links to the privacy policy page to go to preferences and my-data

- The four service offerings should be clickable links that take you to the Contact page and pre-fill in the form with the service the person is interested in. The Contact project scopes could have the four services offerings and a "general questions" option.

- Sticky the table of contents. It should scroll down to the bottom and then stay in place, and scroll up to the top when scrolling up. Should be pushed up the footer when it comes into the viewpoint on scroll down.

- Color headings blue and use the SVG icon instead of the image. Color if the blue shade.

- Social shares - module CSS doesn't appear correct with nested button hover classes, not sure how network name is generated or styled but it needs improvement. Should be rendered inside article content column, not across both content and TOC columns.

- Add a Social Share on some compelling text in each article

- Move the "What I Deliver" box from the Hero into the Backstage image. Move the Backstage image / video to the hero.

- Focus-visible / active handling on ToC nav items
