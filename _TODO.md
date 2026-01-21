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
- Investigate why we're getting hyphenate breaks within words across lines, like or- ders and us- age
- Need to remove automatic abbr handling when the abbreviation is used in a header, also the abbr presentation needs improved - right now it gives a question mark pointer and long delay to appear
- When adding backticks in a callout, it gets the standard grey background for a code block in light theme. But it should get an offset of the callout color, like "info-offset".
- Inline code blocks are not wrapping. They're breaking to a new line. An example is in the "Scenario: CRD Sync Order Problem" section of argocd-sync-failures-gitops-debugging-troubleshooting#specific-failure-scenarios.
- The spacing on unordered task lists nested in an ordered list is wrong, see "Questions to Ask Before Setting Targets" in src/content/articles/availability-targets-five-nines-cost-benefit-analysis/index.mdx
- There's too much space at the bottom of callouts, a full line of extra space in the colored background area.

## Project Stuff

- Need to allow escaping a code fence inside a markdown code fence, see src/content/articles/api-gateway-metrics-traces-logs-debugging/index.mdx "Latency Spike Investigation" section and the demo article.
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

## Content

ephemeral-preview-environments-cost-control-cleanup
error-budget-policy-slo-velocity-reliability-tradeoffs
event-schema-versioning-compatibility-evolution
flaky-test-diagnosis-race-conditions-e2e-stabilization
golden-paths-developer-experience-standardization-autonomy
grafana-dashboard-hygiene-pruning-actionable-metrics
helm-release-management-drift-detection-debugging
idempotent-message-handlers-deduplication-retries
internal-cli-kubectl-terraform-wrapper-abstraction
internal-developer-portal-platform-self-service-actions
internal-platform-api-versioning-deprecation-breaking-changes
kubernetes-cluster-upgrade-playbook-risk-reduction
kubernetes-cost-optimization-resource-sizing-spot-instances
kubernetes-decision-framework-when-not-to-use
kubernetes-dns-debugging-ndots-coredns-troubleshooting
kubernetes-hpa-autoscaling-metrics-tuning-latency
kubernetes-ingress-gateway-api-comparison-migration
kubernetes-multi-cluster-fleet-management-configuration
kubernetes-pod-disruption-budget-autoscaler-node-rotation
kubernetes-pod-resource-requests-limits-qos-classes
kubernetes-secrets-external-secrets-operator-csi-vault
legacy-code-testing-characterization-tests-seams
monorepo-affected-builds-remote-caching-ci-optimization
mtls-certificate-rotation-service-mesh-authentication
nginx-haproxy-reverse-proxy-production-tuning
on-call-rotation-small-teams-sustainable-coverage
opa-conftest-policy-as-code-infrastructure-guardrails
openapi-spec-documentation-sdk-generation-validation
opentelemetry-span-design-granularity-overhead
performance-testing-load-models-benchmark-accuracy
platform-architecture-control-plane-data-plane-separation
platform-engineering-metrics-lead-time-developer-friction
postgresql-connection-pooling-saturation-sizing
private-networking-dns-routing-tls-debugging
prometheus-high-cardinality-metrics-label-design
rate-limiting-token-bucket-leaky-bucket-implementation
release-quality-gates-automated-deployment-validation
* retry-storm-prevention-exponential-backoff-jitter
reverse-engineering-documentation-legacy-systems
service-catalog-metadata-schema-ownership-tracking
service-decommissioning-scream-test-shutdown
sli-selection-user-centric-service-level-indicators
slo-adoption-internal-services-reliability-culture
slsa-build-provenance-artifact-signing-supply-chain
strangler-fig-migration-observability-traffic-shifting
strangler-fig-monolith-auth-extraction-migration
structured-logging-correlation-ids-log-schema-design
symptom-based-alerting-runbooks-alert-design
synthetic-test-data-pii-anonymization-fixtures
terraform-module-design-defaults-versioning-interfaces
terraform-state-locking-corruption-recovery-backend
workload-identity-federation-keyless-cloud-authentication
zero-downtime-database-migration-expand-contract

## Content Issues

- "### Geographic/Currency Mismatches" in src/content/articles/cdn-edge-caching-cache-keys-vary-headers/index.mdx

## Content Instructions

Let's write our next article. Review ./CONTENT.md for the goals and voice to use in our website. Each article outline includes various components we use on our site that can be incorporated into the final article but do not have to be included if they don't fit into the content well or are excessive.

Act as a principal software engineer. Your goal is to write a detailed technical article based on the provided outline. Context: The target audience is Senior DevOps and infrastructure Engineers. The tone should be authoritative, professional, and concise, avoiding fluff or filler words. Think step-by-step before writing to improve the accuracy of technical explanations. Use a friendly first-person voice. Anything that reads like generic marketing copy is not what we want but we still want the effect of being "real" and approachable - try not to sound like technical documentation. We want to show empathy for our readers.

Let's work through each article section by section based on the H2 headers in the outline. Do not do the whole document in one pass. Write directly into the *.astro article file, not into the chat window (it's difficult to read). If the section looks good as-is, I'll just type "ok" so you know to continue to the next section.

- Ignore the coverAlt frontmatter line that has "TODO". It will be added later when cover art is added.
- Use a single underscore for emphasis style, not asterisks.
- Use plain quotations and apostrophes, not smart quotes. Do not start the article with an H1 in the Markdown - the system automatically adds the title frontmatter key as an H1 header.
- Prefer contracted forms like "Here's" instead of "Here is". The content is so technical I want to make it a little more approachable.
- Let's not use code blocks if it's just a presentation gimmick. Code blocks should be pseudocode that applies to a real tool, or in a limited usage (once per file), a markdown runbook.
- If it's necessary to show a nested code fence inside a markdown code fence in the document (for example, a markdown runbook that has a prometheus config example inside the runbook), escape the backticks for the nested code fence so that our system handles it correctly. Ensure there is a blank line before and after the escaped code fence. For example:

```markdown title="some-runbook.md"
# An example runbook in an article

\`\`\`promql
some config
\`\`\`
```

For code examples like YAML config, use a concrete tool context so readers can understand where they would deploy or use the code. A single comment line or reference to the tool, or a descriptive file name, is sufficient. Prefer showing usage for AWS but a small amount of variety showing open source tools is the optimal case. So, for example, if there were four config examples, three might apply to AWS and one to an alternative tool. Do not include multiple tables, code blocks, or mermaid diagrams in a row without text between them to break them up. Do not import the Callout component, it is automatic. Don't use code blocks just for presentation, only for true pseudocode or real code examples. If there is info in a code block in the outline that is only for presentation purposes, redo it in a better presentation format.

We are writing an article based on an outline, not just merely adding a few lines of text around existing outline elements like code blocks, diagrams, etc. We should evaluate whether the element makes any sense to keep - in some cases, they do not. We want to talk to the reader, not just introduce some element that already exists. But do keep elements that add value - the reason we have them in the outline is to give some ideas to help us avoid a "wall of text" which is where we've ended up also. We need to find a happy medium ground between "text only" that is difficult to work through, and just introductory sentences added for code blocks, diagrams, and other elements that are added to the diagram to give us something to work with and provide variety.

__review__

We implemented our article by first generating an outline, and then writing each of the sections one by one. Please review the document in its entirety now, and make any suggestions you find that would improve the readability or quality of the article. Do not make any changes - just review and put together a list of suggestions to discuss.

__reduce__

We're going to use the document we just created as a PDF download deep-dive on this topic. Let's generate a shorter article from the document. It should be about 1500 words, have a compelling hook, and cover 2-3 sections of the longer document that carry the weight. Please generate an outline for this article.

__implement_article__

I renamed our longer article to pdf.mdx and created an empty index.mdx template. Ignore the coverAlt frontmatter line that has "TODO". It will be added later when cover art is added. Use a single underscore for emphasis style, not asterisks. Use plain quotations and apostrophes, not smart quotes. Do not start the article with an H1 in the Markdown - the system automatically adds the title frontmatter key as an H1 header. Let's implement the article we just outlined. The captions for tables and other elements use a prefix like ("Table: ") to let the unified markdown pipeline know to convert this into a caption - don't worry about the prefixes, they'll be normalized later.

Add suggested text for a call to action to download the longer PDF at the bottom of the article under an HR. Do not worry about optimizing this text for the total word count of the article - it is not included in the word count since it will be used in a CTA, and I will handle deducting so there's no need to worry about complex calculations to the word count. Don't include a link in the CTA. Do not mention the word length. Do not worry about formatting - the content will be used as props for a dedicated Component. Do not include multiple tables, code blocks, or mermaid diagrams in a row without text between them to break them up. Do not import the Callout component, it is automatic.

__review_article__

Let's review the article in its entirety now, and make any suggestions you find that would improve the readability or quality of the article. Do not make any changes - just review and put together a list of suggestions to discuss. Ignore the call to action at the bottom of the article.
