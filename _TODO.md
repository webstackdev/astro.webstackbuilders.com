<!-- markdownlint-disable-file -->
# TODO

Clear All Workspace Chats

## E2E Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18)

Playwright's Built-in Visual Testing

Playwright has a built-in visual comparison feature using await expect(page).toHaveScreenshot().

How it works: On the first run, Playwright saves a baseline screenshot. Subsequent runs compare the actual screenshot to this baseline, failing the test if there are pixel differences.

Pros: It's free, everything stays local (no third-party services needed), setup is simple, and you retain full control over the baseline images in your repository.

Cons: Browser rendering can be inconsistent across different operating systems and machines, leading to "flaky" tests or false positives. Managing baselines for multiple browsers and resolutions manually can also be challenging at scale.

Axe accessibility (2) - axe-core integration

## Youtube video for Backstage IDP hero on Home page

Discuss agentic AI integrations to add to Backstage

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

## Home Page Ordering

- Hero
- About Preview ("Building the Future of Software Development")
- Featured Services
- (Todo) Turn-Key Backstage IDP Implementation
- Testimonials
- Latest Articles
- Primary CTA ("Ready to Transform Your Development Process?") with links to /contact and /services
- Newsletter Signup
- Skills/Technologies Preview (__move to after "About Preview"__)

Maybe change the "ready..." in the hero to "get in touch..."

## Search Box

- Show article titles only in drop-down search result box, and dedupe results

## Mobile Table of Contents

There are six examples of TOC drawers on mobile. We have an implementation currently, but it's not very good. We should improve the component to use one of the patterns show in the examples.

## ToolTips

Need a tooltip component for consistency. List to add tooltips to:

- Themepicker button
- Search button
- Abbreviations in markdown
- "Report a Bug" in footer
- RSS feed icon in footer

## Theming and improving Mermaid diagrams

[rerender diagrams when I switched color-scheme](https://github.com/mermaid-js/mermaid/issues/1945)
[mermaid init](https://github.com/hbstack/mermaid/blob/main/assets/hb/modules/mermaid/init.ts)
[theming](https://mermaid.ai/open-source/config/theming.html)

## Support Pages to Style

- /
- /404
- /about
- /consent
- /contact
- /downloads/[slug]
- /newsletter/confirm/[token]
- /offline
- /privacy
- /privacy/my-data
- /search
- /tags/[tag]
- Bug reporter modal
- Email templates

## Keyboard Navigation

- Should header links be in the tab order?
- Does the total page tab order make sense?

## Lead on Hero for Articles

There's an [example screen shot](src/components/Layout/Markdown/Lead/lead-on-hero-example.png) from CSS-Tricks showing a layout of the author avatar, author name, published date, and title overlaid on the cover image. It would save space on the page. Probably should have it above the image on mobile to avoid visibility issues.

A scrim is an elliptical gradient from translucent black (center) to transparent black (edges), strategically placed behind white text. The scrim is probably the most subtle way of reliably overlaying text on images out there, and very few designs use this technique.

To overlay an article title and published date on a cover image, use CSS positioning, specifically position: relative on the container and position: absolute on the text elements, combined with design techniques to ensure readability such as a semi-transparent overlay or text shadows.

## Stylings

- Add 'featured' to tags to filter, and move tags page to articles
- Need to make tables responsive on mobile
- Investigate why we're getting hyphenate breaks within words across lines, like or- ders and us- age
- Need to remove automatic abbr handling when the abbreviation is used in a header, also the abbr presentation needs improved - right now it gives a question mark pointer and long delay to appear
- When adding backticks in a callout, it gets the standard grey background for a code block in light theme. But it should get an offset of the callout color, like "info-offset".
- Inline code blocks are not wrapping. They're breaking to a new line. An example is in the "Scenario: CRD Sync Order Problem" section of argocd-sync-failures-gitops-debugging-troubleshooting#specific-failure-scenarios.
- The spacing on unordered task lists nested in an ordered list is wrong, see "Questions to Ask Before Setting Targets" in src/content/articles/availability-targets-five-nines-cost-benefit-analysis/index.mdx
- There's too much space at the bottom of callouts, a full line of extra space in the colored background area.

## Project Stuff

- Re-enable link validator in astro.config.ts when pdf / downloads sorted out
- Need to allow escaping a code fence inside a markdown code fence, see src/content/articles/api-gateway-metrics-traces-logs-debugging/index.mdx "Latency Spike Investigation" section and the demo article.
- Themepicker: need to tweak 1px border for non-active theme cards
- I aliased 'promql' to 'go'. When a code fence using the alias is rendered with the language set to 'promql', it shows as 'go' incorrectly because of the alias. Also we need custom handling for all language names that are displayed: html should be uppercase, typescript as TypeScript, etc. Also we don't want all aliased names to show the alias - for example using the aliases 'ts', 'js', and 'md' would be better to show the full language names.
- The "go" language code block in src/content/articles/api-versioning-deprecation-sunset-headers-migration/index.mdx is not being combined with the "typescript", "python", and "ruby" tabbed code block. Same with "python" block in "### Admission Control Strategies" section of src/content/articles/backpressure-load-shedding-admission-control-overload/index.mdx, plus the line numbering is weird in the code block.
- Add people who sign up for newsletter, download, or fill out contact form to Hubspot tracking. Need to configure it to remove them if they do the GDPR remove me. Also remove them from the newsletter.
- The title for a code block with yaml as the language type in "Sync wave annotations controlling resource application order" section of src/content/articles/argocd-sync-failures-gitops-debugging-troubleshooting/index.mdx is not displaying, it's showing the YAML language tag instead of the title. Also, the word "app" is being highlighted for some reason in this code block.
- Code block formatting for 'text' language is very plain.
- Mathjax not working on inline formulas: "Where $L$ is the average number of items in the system (queue depth), $\lambda$ is the arrival rate (requests per second), and $W$ is the average time in system (latency)." In backpressure-load-shedding-admission-control-overload, also "The Retry Amplification Problem" section in circuit-breaker-retry-budget-cascade-failure-prevention.
- Uppy, Tus server, whatever other server needed
- Need a Q & A format to use in blameless-postmortem-incident-analysis-systemic-causes
- Numbering for ordered lists breaks when there are code blocks in between numbered list elements, like in src/content/articles/cdn-edge-caching-cache-keys-vary-headers/index.mdx
- Add a cloud of tags on articles list view at top for quick navigation. Add a ToC for featured tags so it's available on mobile, but with something different on desktop view - maybe hide tag cloud on mobile, and show it with an HR between all tags cloud and featured on desktop.
- The "❌" symbol is not showing in sql code block, it's rendering as a plain "X". But "✅" renders okay. src/content/articles/database-schema-migrations-continuous-deployment-zero-downtime/index.mdx
- Use an in-project Image component to wrap Astro's Image and Picture. Show a magnifying glass with a "+" for the cursor on hover, and a modal to show a magnified view of images on click.
- Add a copyright notice to content
- Probably a duplicate, but need to stop system from adding abbreviation html when used in headings
- DownloadLayout to wrap downloads.mdx in each folder, generate content for each
- Time in prose is causing a line break, and the colon and minutes to be removed - "2:47 AM" in src/content/articles/mtls-certificate-rotation-service-mesh-authentication/pdf.mdx
- Language "haproxy" is not highlighting Shiki, need to adjust allowed languages in config
- Should we exclude "Footnotes" from the ToC list? Right now it shows at the bottom if there's a Footnotes H2.
- If a reader has already given their email address - newsletter signup, contact form, download registration, then the download CTA on short form articles should go directly to the HTML version of the deep dive, and it should have a PDF download button. Think this workflow through - maybe a "Short / Deep-Dive" slider button on top and don't show the CTA + the PDF download button.
- The articles list page should show tags at top for quick navigation. There's another note about this. Show the count of articles per tag unless they're all the same on the tag.
- Maybe duplicate - scrunch the header and set at absolute position when you scroll down, expand back when scroll up
- 404 page should show search results based on query
- Times like "11:59:59" are breaking across two lines - src/content/articles/rate-limiting-token-bucket-leaky-bucket-implementation/index.mdx in "Algorithm Overview" section
- Remove the dynamic Services page, and show it all on a single page. Three services: full time workflow, part time workflow, on-call support + onboarding fee.
- add "cel" language to code blocks
- hovering menu items should cause the dots to disappear immediately and then the animation slide to start
- Update EXIF data on all AI generated JPGs
- See if there's any code in common between Carousel, Testimonials, and Themepicker. We have another one to add that uses the carousel code - for Skills.

## Header

Title box - need to squish to 75% and have it absolute in place as you scroll down, go back to 100% when you scroll back up

[example](https://thenewstack.io/)

## Reading position indicator

[Add scroll bar under header](https://css-tricks.com/reading-position-indicator/) to show how far down you are on the page while reading

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

## Downloads Collection

Remove the `content/downloads` folder, and point the content collection to look for a `download.astro` file in the `contents/articles` folder. Exclude the `pdf.astro` file from the Articles collection. Generated PDFs go into the public directory maybe? See the note on gating below.

## Downloads / Gated Content

- The PDF downloads are going to be gated - the user has to sign up for them and give an email address. How do we handle the keywords in these from a search perspective?
- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading.

## Content Issues

- "### Geographic/Currency Mismatches" in src/content/articles/cdn-edge-caching-cache-keys-vary-headers/index.mdx
- cover.jpg for reliability-and-testing needs touch up in GIMP
