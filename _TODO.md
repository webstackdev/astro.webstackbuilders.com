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

## Header

Title box - need to squish to 75% and have it absolute in place as you scroll down, go back to 100% when you scroll back up

[example](https://thenewstack.io/)

## Mobile Table of Contents

There are six examples of TOC drawers on mobile. We have an implementation currently, but it's not very good. We should improve the component to use one of the patterns show in the examples.

## Lead on Hero for Articles

There's an [example screen shot](src/components/Layout/Markdown/Lead/lead-on-hero-example.png) from CSS-Tricks showing a layout of the author avatar, author name, published date, and title overlaid on the cover image. It would save space on the page. Probably should have it above the image on mobile to avoid visibility issues.

## Themepicker

Need to tweak 1px border for non-active theme cards

## ToolTips

Need a tooltip component for consistency. List to add tooltips to:

- Themepicker button
- Search button
- Abbreviations in markdown
- "Report a Bug" in footer
- RSS feed icon in footer

[rerender diagrams when I switched color-scheme](https://github.com/mermaid-js/mermaid/issues/1945)
[mermaid init](https://github.com/hbstack/mermaid/blob/main/assets/hb/modules/mermaid/init.ts)
[theming](https://mermaid.ai/open-source/config/theming.html)

## Services

COAK has two pricing tiers:

- Continuous Workstream, $9,500 per month. For ongoing development and long-term partnership. Steady progress on your roadmap without the pressure of hard deadlines.

- Full Workstream, $19,500 per month. For hard deadlines and high velocity projects. When you need to move fast and can't afford to wait.

"We guarantee you we can build it in 30 days for a budget you can afford."

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

## Text on Images

A scrim is an elliptical gradient from translucent black (center) to transparent black (edges), strategically placed behind white text. The scrim is probably the most subtle way of reliably overlaying text on images out there, and very few designs use this technique.

To overlay an article title and published date on a cover image, use CSS positioning, specifically position: relative on the container and position: absolute on the text elements, combined with design techniques to ensure readability such as a semi-transparent overlay or text shadows.

## Stylings

- Add 'featured' to tags to filter, and move tags page to articles
- Need to make tables responsive on mobile

## Project Stuff

- Need to allow escaping a code fence inside a markdown code fence, see src/content/articles/api-gateway-metrics-traces-logs-debugging/index.mdx "Latency Spike Investigation" section and the demo article.
- I aliased 'promql' to 'go'. When a code fence using the alias is rendered with the language set to 'promql', it shows as 'go' incorrectly because of the alias. Also we need custom handling for all language names that are displayed: html should be uppercase, typescript as TypeScript, etc. Also we don't want all aliased names to show the alias - for example using the aliases 'ts', 'js', and 'md' would be better to show the full language names.

## Reading position indicator

[Add scroll bar under header](https://css-tricks.com/reading-position-indicator/) to show how far down you are on the page while reading

## Print

- Need a workflow to generate PDF files from Markdown for downloads.
- Add a QR code at the bottom of printed pages so it's easier for someone to navigate to from a printed page.
- Need a layout alternative to Markup that formats for print. It needs to handle TOC differently as a full-width page. Need a fixed cover page format that adds article title, subtitle, and date.
- We have two print scenarios: black and white, and color for PDF output. Can use two different media queries to accomplish getting colored variables.

[Paged.js](https://pagedjs.org/en/documentation/) polyfills `@page` properties, and lays out an HTML document in print format where it can have page numbers generated to update in a table of contents.

[This article](https://excessivelyadequate.com/posts/print.html) shows how to control the following properties in Chrome's Print Properties dialog box from CSS: Layout, Paper size, Margins, Headers and footers, and Background graphics. Headers and footers is the checkbox that by default is enabled and adds information on printed pages. It also shows how to use Chrome from the terminal in headless mode to output a PDF file from an HTML page.

This article has different approaches to [print pagination](https://www.customjs.space/blog/html-print-pagination-footer/). One approach overlaps with PagedJS's approach.

## Downloads Collection

Remove the `content/downloads` folder, and point the content collection to look for a `download.astro` file in the `contents/articles` folder. Exclude the `pdf.astro` file from the Articles collection. Generated PDFs go into the public directory maybe? See the note on gating below.

## Downloads / Gated Content

- The PDF downloads are going to be gated - the user has to sign up for them and give an email address. How do we handle the keywords in these from a search perspective?
- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading.

## Image generation models

I think we want more human images, with less video-gamey graphics and more likeable human figures.

- dall-e (OpenAI)
- flux pro - text-to-image and image-to-image generation, developed by Black Forest Labs, known for its exceptional speed, high visual quality, and superior prompt adherence, offering features like advanced editing, video generation, and context-aware understanding through platforms like Flux.ai, Fal.ai, and Skywork.ai. It serves as a professional-grade creative tool, balancing performance with user-friendly access for detailed content creation.
- nano banana (Google)
- sd3 (Stability AI's Stable Diffusion 3, open source)
- Seedream 4.0 model from ByteDance

Considered excellent for text-to-image (T2I) tasks and is a top competitor in the field. It has been highly rated in benchmarks and is praised for its high-quality, realistic output and strong prompt adherence.

Key Features for Text-to-Image Generation

High Performance: The model performs well across core dimensions like prompt adherence, alignment, and aesthetics, often ranking first in internal and public evaluations.

Aesthetics and Realism: It generates images that are very realistic, with impressive texture, lighting, and color, making it difficult to distinguish them from real photographs in some cases.

High Resolution: Seedream 4.0 is capable of generating native high-resolution images, up to 4K (4096px), which is a significant advantage over many competing models that are often capped at 2K.

Complex Text and Instruction Following: The model demonstrates an enhanced understanding of complex semantic prompts and excels in rendering dense and accurate text within the generated images, a common weakness in other AI image models.

## Content Instructions

Let's write our next article. Review ./CONTENT.md for the goals and voice to use in our website. Each article outline includes various components we use on our site that can be incorporated into the final article but do not have to be included if they don't fit into the content well or are excessive.

Act as a principal software engineer. Your goal is to write a detailed technical article based on the provided outline. Context: The target audience is Senior DevOps and infrastructure Engineers. The tone should be authoritative, professional, and concise, avoiding fluff or filler words. Think step-by-step before writing to improve the accuracy of technical explanations. Use a friendly first-person voice. Anything that reads like generic marketing copy is not what we want but we still want the effect of being "real" and approachable - try not to sound like technical documentation. We want to show empathy for our readers.

Let's work through each article section by section based on the H2 headers in the outline. Write directly into the *.astro article file, not into the chat window (it's difficult to read). If the section looks good as-is, I'll just type "ok" so you know to continue to the next section.

- Ignore the coverAlt frontmatter line that has "TODO". It will be added later when cover art is added.
- Use a single underscore for emphasis style, not asterisks.
- Use plain quotations and apostrophes, not smart quotes. Do not start the article with an H1 in the Markdown - the system automatically adds the title frontmatter key as an H1 header.
- Prefer contracted forms like "Here's" instead of "Here is". The content is so technical I want to make it a little more approachable.
- If it's necessary to show a nested code fence inside a markdown code fence in the document (for example, a markdown runbook that has a prometheus config example inside the runbook), escape the backticks for the nested code fence so that our system handles it correctly. Ensure there is a blank line before and after the escaped code fence. For example:

```markdown title="some-runbook.md"
# An example runbook in an article

\`\`\`promql
some config
\`\`\`
```

For code examples like YAML config, use a concrete tool context so readers can understand where they would deploy or use the code. A single comment line or reference to the tool, or a descriptive file name, is sufficient. Prefer showing usage for AWS but a small amount of variety showing open source tools is the optimal case. So, for example, if there were four config examples, three might apply to AWS and one to an alternative tool. It is unnecessary to give complete examples - just enough to convey what we would inform the reader of by using a generic code or config example, and an appropriate marker (like ellipses or a comment saying a cut is made) to show that the example is not complete. An explanatory paragraph is good too.

__review__

We implemented our article by first generating an outline, and then writing each of the sections one by one. Please review the document in its entirety now, and make any suggestions you find that would improve the readability or quality of the article. Do not make any changes - just review and put together a list of suggestions to discuss.

__reduce__

We're going to use the document we just created as a PDF download deep-dive on this topic. Let's generate a shorter article from the document. It should be about 1500 words, have a compelling hook, and cover 2-3 sections of the longer document that carry the weight. Please generate an outline for this article.

__implement_article__

I renamed our longer article to pdf.mdx and created an empty index.mdx template. Ignore the coverAlt frontmatter line that has "TODO". It will be added later when cover art is added. Use a single underscore for emphasis style, not asterisks. Use plain quotations and apostrophes, not smart quotes. Do not start the article with an H1 in the Markdown - the system automatically adds the title frontmatter key as an H1 header. Let's implement the article we just outlined. The captions for tables and other elements use a prefix like ("Table: ") to let the unified markdown pipeline know to convert this into a caption - don't worry about the prefixes, they'll be normalized later.

Add suggested text for a call to action to download the longer PDF at the bottom of the article under an HR. Do not worry about optimizing this text for the total word count of the article - it is not included in the word count since it will be used in a CTA, and I will handle deducting so there's no need to worry about complex calculations to the word count. Use "/" as the link so we avoid problems with our link validator, since the PDF doesn't exist yet. Do not mention the word length. Do not worry about formatting - the content will be used as props for a dedicated Component. It should have a lead hook (title), subtitle introducing what the deep dive is about, then a number of bullet points in the format of `- <topic>: enumeration of subtopics`, and a closing hook sentence.

__review_article__

Let's review the article in its entirety now, and make any suggestions you find that would improve the readability or quality of the article. Do not make any changes - just review and put together a list of suggestions to discuss.
