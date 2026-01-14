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

## Tags

Add a "coreCategory" boolean prop to tags, and sort to only show those on the /articles path. That way we can have languages like Terraform or tech like Helm as tag categories.

Link to the second-order category from the "Skills/Technologies Preview" icons on the home page. They should have descriptions of the tech.

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

## Keyboard Navigation

- Should header links be in the tab order?
- Does the total page tab order make sense?

## Text on Images

A scrim is an elliptical gradient from translucent black (center) to transparent black (edges), strategically placed behind white text. The scrim is probably the most subtle way of reliably overlaying text on images out there, and very few designs use this technique.

To overlay an article title and published date on a cover image, use CSS positioning, specifically position: relative on the container and position: absolute on the text elements, combined with design techniques to ensure readability such as a semi-transparent overlay or text shadows.

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

We have generated detailed outlines for each of the MDX proposed articles we have in src/content/articles. It's time to write our articles. Review ./CONTENT.md for the goals and voice to use in our website. Each outline includes various components we use on our site that can be incorporated into the final article but do not have to be included if they don't fit into the content well or are excessive.

Act as a principal software engineer. Your goal is to write a detailed technical article based on the provided outline. Context: The target audience is Senior DevOps and infrastructure Engineers. The tone should be authoritative, professional, and concise, avoiding fluff or filler words. Think step-by-step before writing to improve the accuracy of technical explanations. Use a friendly first-person voice. Anything that reads like generic marketing copy is not what we want but we still want the effect of being "real" and approachable - try not to sound like technical documentation. We want to show empathy for our readers.

Let's work through each article section by section based on the H2 headers in the outline. If the section looks good as-is, I'll just type "ok" so you know to continue to the next section.

## Move hard-coded options from integrations to astro.config.ts

### CTA validator

Let's also refactor the CtaValidator integration to allow passing in options from astro.config.ts instead of hard-coding things in the integration. We should be able to:

- pass in the required CallToActions in the src/components/CallToAction as an array
- pass in the debug flag

I think we can remove the additionalPatterns option, it appears unused but need to check.

I added a new folder in the CallToAction component folder that won't be required for articles.


