# TODO

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## GitHub

- Make sure actions workflows are working correctly after performance tests pass and whole suite is green
- Change Dependabut to open a single PR with all dependency updates
- Add 'hotfix' branch and add branch protection rules

## Analytics

Vercel Analytics

## Themepicker tooltips, extra themes

- Add additional themes
- Add tooltip that makes use of the description field

## Sentry feedback, chat bot tying into my phone and email

See note in src/components/scripts/sentry/client.ts - "User Feedback - allow users to report issues"

## Uppy file uploads from contact form

docs/CONTACT_FORM.md

## Search

Add Upstash Search as a Vercel Marketplace Integration.

Lunr is a JS search library using an inverted index. Client-side search for statically hosted pages.

### [`@jackcarey/astro-lunr`](https://www.npmjs.com/package/@jackcarey/astro-lunr)

### [`@siverv/astro-lunr`](https://www.npmjs.com/package/@siverv/astro-lunr)

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## @TODO: Provide button to turn off animation in Hero

"Scaling/zooming animations are problematic for accessibility, as they are a common trigger for certain types of migraine. If you need to include such animations on your website, you should provide a control to allow users to turn off animations, preferably site-wide.  Also, consider making use of the prefers-reduced-motion media feature — use it to write a media query that will turn off animations if the user has reduced animation specified in their system preferences. "

## Color vars

brand primary:    #001733
brand secondary:  #0062B6

ring (1px), ring-2, ring-4
accent

text-white, other default Tailwind colors

## Typing client-side API calls and SSR API endpoints

Shared Types vs Swagger / Keeping Docs in Sync

1. Type-only sharing (current approach)

- Pros: zero extra build tooling, server/client stay aligned as long as both import @pages/api/_contracts.
- Cons: no generated docs/SDKs; discipline is required to keep manual docs current.
- How to enforce: treat the contract files as the single source of truth, add lint rules banning request/response literal types outside _contracts, and add lightweight contract tests that instantiate each type against the endpoint handler (failing if fields diverge).

1. Code-first OpenAPI (Zod or TS schemas → OpenAPI)

- Define schemas in Zod/Valibot (or ts-rest) alongside the endpoint. Generate OpenAPI JSON plus TypeScript types from those schemas. Docs (Swagger UI/Redoc) and any client SDKs come from the generated spec, so they're always in sync.
- Guarantees: CI regenerates the spec and fails when the checked-in artifact is stale; endpoint handlers reuse the same schema for runtime validation, so a mismatch cannot compile.

1. Spec-first OpenAPI + Swagger Codegen

- Maintain an OpenAPI YAML/JSON file as the source of truth, run Swagger Codegen (or openapi-typescript) to produce both server stubs and client SDKs.
- Guarantees: developers edit the spec, run codegen (enforced via a pre-commit/CI task), and the generated server stubs remind you to implement every path/verb. Documentation pages (Swagger UI) are rendered straight from the same spec, so they inherently match the implementation.

Affected components:

- CallToAction/Newsletter
- ContactForm

## Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18) - Needs Percy/Chromatic
Lighthouse audits (6) - Integration pending
Newsletter double opt-in (6) - Email testing infrastructure
Axe accessibility (2) - axe-core integration

## Axe tags

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

## @TODO: Add Check HTML Links to test workflow

npm i -D check-html-links
npx check-html-links _site
`https://github.com/modernweb-dev/rocket/tree/main/packages/check-html-links`

## Social Media Preview Cards

Looking at the social-card endpoint implementation, it's designed to work with third-party screenshot services, not the social networks themselves.

Here's how it works:

The Two Formats
HTML format (format=html or default): Returns a full HTML page with inline CSS styled as a 1200x630px card - the standard Open Graph image dimensions.

OG format (format=og): Returns JSON with Open Graph meta tags, where the og:image URL points back to the HTML version of the card.

How Social Networks Actually Work
Social networks like Twitter, Facebook, LinkedIn, etc. don't screenshot HTML pages. They expect:

- Direct image URLs (PNG, JPEG, etc.)
- Standard dimensions (1200x630px for most platforms)

**The Intended Workflow**

This endpoint is designed to integrate with screenshot services like:

- Puppeteer or Playwright - Run your own screenshot service
- Vercel OG Image Generation - Vercel's built-in service
- Cloudinary - Can fetch and screenshot URLs
- ScreenshotOne or ApiFlash - Dedicated screenshot APIs
- Satori - Convert HTML/CSS to SVG/PNG

**Current Limitation**

As implemented, this endpoint would need an additional step to be useful for social sharing:

Your endpoint → Screenshot service → Image file → Social networks

Better Approaches

For a production Astro site, you'd typically:

- Use @vercel/og or Satori to generate actual images server-side
- Pre-generate images at build time for static content
- Use a screenshot service that can be called from your endpoint to return actual images

**Social Media Preview Generators**

There are several integrations available that vary based on the library they use to create an image file to snapshot, whether they allow the template for generating the image to be modified, and what options they provide for output.

[`astro-og-canvas`](https://www.npmjs.com/package/astro-og-canvas)

- Most popular option (~660 weekly d/l). Generates images at **run time**.
- Uses **`canvaskit-wasm`** for rendering
- Uses plain color or gradient background. Provide title, description, and logo (displayed at top left of card).
- Can't set size of final card.

[`astro-satori`](https://www.npmjs.com/package/astro-satori)

- Moderately popular option (~230 weekly d/l). Generates images at **run time**.
- Uses Vercel's **Satori** library for rendering (entirely done in JS with limitations on what CSS can be used). Satori is a library for generating SVG strings from pure HTML and CSS.
- Size of final card can be set.
- Seems opinionated, but it might be possible to have a lot of control (not sure).
- Output format?

[`astro-opengraph-image`](https://www.npmjs.com/package/@altano/astro-opengraph-image#fn-filename-change)

- Uses **Satori**. Has dependencies on [`@resvg/resvg-wasm`](https://www.npmjs.com/package/@resvg/resvg-wasm) and Sharp. Middleware integration. Generates images at **run time**.
- Provides element to add OG tags in document `<head>`.
- Very flexible, you can provide the Astro template to generate the card.

[Astro Open Graph Image](https://www.npmjs.com/package/astro-og-image)

- Uses **Puppeteer**. Generates images at **build time**.
- You can provide the Astro template to generate the card.
- Requires providing a `baseHead` property in page templates.

[Astro Open Graph Image Generator](https://www.npmjs.com/package/@cyberkoalastudios/og-image-generator)

- Uses **Puppeteer**. Has dependencies on [`canvaskit-wasm`](https://www.npmjs.com/package/@resvg/resvg-wasm) and Sharp.
- You can set the background image. No option to set the size of the card.
- Manually add OF properties on `<head>` element. Flexible.

## @TODO: Use Confetti on CTA forms

`canvas-confetti`
`https://github.com/catdad/canvas-confetti`
`https://www.kirilv.com/canvas-confetti/`

## @TODO: Use the Page Visibility API to pause videos, image carousels, and animations

Stop unnecessary processes when the user doesn't see the page or inversely to perform background actions.

## @TODO: "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

`https://github.com/add2cal/add-to-calendar-button`
`https://add-to-calendar-button.com/`

## @TODO: Set up webmentions

Needs to add real API key and test

## @TODO: SCSS Use clothoid corners with border-radius

`https://onotakehiko.dev/clothoid/`

`@TODO: SCSS Make sure accent-color or styling for checkboxes/radio button groups is set up. Sets the colour used by checkboxes and radio buttons, as well as range fields and progress indicators. The accent colour is inherited`

```scss
:root{
  accent-color : #696;
}
```

## @TODO: Refactor modals

Modals should be wrapped in the `<dialog>` element and use programmatic methods to display - `showModal()` to disable the area outside of the modal (handles `esc` keypress natively) and `show()` to allow interaction outside the modal, along with `close()`.

## @TODO: Add for iOS

Specifying a Launch Screen Image

On iOS, similar to native applications, you can specify a launch screen image that is displayed while your web application launches. This is especially useful when your web application is offline. By default, a screenshot of the web application the last time it was launched is used. To set another startup image, add a link element to the webpage, as in:

```html
<link rel="apple-touch-startup-image" href="/launch.png">
```

# Astro 3rd-Party Integrations, Eleventy Migration

## Eleventy plugins that don't yet have identified equivalents for Astro.

- **`eleventy-plugin-inclusive-language`**

## Outputs command line warnings for weasel words like "obviously", "basically", etc.

- **`eleventy-plugin-external-links`**

## Adds `target="_blank" rel="noreferrer"` to all external links

- **`eleventy-plugin-emoji`**

## Accessible emoji shortcode and filter. Usage:

```{% emoji "⚙️", "settings gear" %} or {{ "⚙️" | emoji: "settings gear" }}```

- **`eleventy-plugin-nesting-toc`**

## Generates a nested table of contents for use in an aside from page contents.

```typescript
{
    /** Which heading tags are selected, where each headings must have an ID attribute */
    tags: ['h2', 'h3'],
    /**
     * Elements to ignore when constructing the label for every header. Useful for
     * ignoring permalinks. Must be selectors.
     */
    ignoredElements: [], // default
    /** Element to put around the root `ol` */
    wrapper: 'nav', // default
    /** Class for the element around the root `ol` */
    wrapperClass: 'toc', // default
    /** Optional text to show in heading above the wrapper element */
    headingText: '', // default
    /** Heading tag when showing heading above the wrapper element */
    headingTag: 'h2', // default
  }
```

## Time to Read

Adds filter for analyzing content input into the filter and returning a time-to-read estimate to use in text like 'This will take 3 minutes to read'.

```typescript
{
    speed: '200 words per minute',
    /** 'long': 3 minutes and 10 seconds, 'short': 3 min & 10 sec, 'narrow': 3m, 10s */
    style: 'narrow',
    /** Which time units to render */
    hours: false,
    minutes: true,
    seconds: false,
    /**
     * Format returned string
     *
     * @param {object} data - An object with various keys, see docs
     * @returns {string} Returns the formatted string to return from time-to-read shortcode
     */
    output: function (data) {
      return data.timing
    },
  }
```

## An accessible Emoji component. Wraps emojis in a `<span>` with `aria-label` or `aria-hidden`, and `role` attributes

[`astro-emoji`](https://github.com/seanmcp/astro-emoji#astro-emoji)

## Table of Contents (ToC) generator

[`astro-toc`](https://github.com/theisel/astro-toc#readme)

## Astro wrapper for the `@github/clipboard-copy-element` web component. Copies element text content or input values to the clipboard

[`clipboard-copy`](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/clipboard-copy#astro-github-elementsclipboard-copy)

## Astro wrapper for GitHub's relative time web component. Translates dates to past or future time phrases, like "*4 hours from now*" or "*20 days ago*"

[Relative Time](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/time#readme)

### Display text in a circular layout

[TextCircle](https://github.com/LoStisWorld/astro-textcircle#astro-textcircle)

## Markdown

### Custom version of the code block integration from Astro Docs. "Beautiful code blocks for your Astro site". Applied to the code blocks created in `.mdx` files

[`astro-code-blocks`](https://www.npmjs.com/package/@thewebforge/astro-code-blocks)

## Miscellaneous

### [`astro-auto-import`](https://www.npmjs.com/package/astro-auto-import)

Allows you to auto-import components or other modules and access them in MDX files without importing them.

### [`astro-directives`](https://github.com/QuentinDutot/astro-directives)

Adds some custom directives:

```react
<Component client:hover />
```

| Attribute     | Load the javascript and hydrate on ... |
| ------------- | -------------------------------------- |
| client:click  | element click event                    |
| client:hover  | element mouseover event                |
| client:scroll | window scroll event                    |

### [Prefetch](https://www.npmjs.com/package/@astrojs/prefetch) (**`installed`**)

1. Add `rel="prefetch"` to any `<a />` tags to prefetch when visible
2. Add `rel="prefetch-intent"` to any `<a />` links on your page to prefetch them only when they are hovered over, touched, or focused.

### [astro-webfinger](https://www.npmjs.com/package/astro-webfinger)

Allows any Mastodon instance to discover your Mastodon profile directly from your own domain.

## Preload hero images, usually loaded after stylesheets and fonts

```font
<head>
  <!-- Hey browser! Please preload this important responsive image -->
  <link
    rel="preload"
    as="image"
    imagesrcset="
      image-400.jpg 400w,
      image-800.jpg 800w,
      image-1600.jpg 1600w"
    imagesizes="100vw"
  >
</head>
<body>
  <img
    srcset="
      image-400.jpg 400w,
      image-800.jpg 800w,
      image-1600.jpg 1600w"
    sizes="100vw"
    alt="..."
  >
</body>
```

## Display a system font until font files load (Lighthouse improvements)

Display a system font until font files load to improve FCP (First Contentful Paint) with `font-display: swap`. Need to make sure that web font doesn't render larger or smaller than the system font fallback to avoid CLS (Cumulative Layout Shift) issues.

```css
@font-face {
  font-family: 'Pacifico';
  font-style: normal;
  font-weight: 400;
  src: local('Pacifico Regular'), local('Pacifico-Regular'),
    url(https://fonts.gstatic.com/s/pacifico/v12/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2) format('woff2');
  font-display: swap;
}
```

Preload fonts:

```html
<link rel="preload" as="font" />
```

TTI (Time to Interactive) measures time from when the page is painted until it becomes usefully interactive.
Interactive can only have two in-flight network requests.

## Stuff from ZMarkdown, a prepackaged Unified config

Repo is in root of Corporate Websites

- **mdast-util-split-by-heading**

  A MDAST tool to split a markdown tree into list of subtrees representing the chapters. It relies on heading depth.

- **rebber**

  transformation of MDAST into `latex` code. This code must be included inside a custom latex to be compiled.
  Have a look at `https://github.com/zestedesavoir/latex-template/blob/master/zmdocument.cls` to get a working example.

- **remark-abbr**

  This plugin parses `*[ABBR]: abbr definition` and then replace all ABBR instance in text with a new MDAST node so that `rehype` can parse it into `abbr` html tag.

- **rehype-footnotes-title**

  This plugin adds a `title` attribute to the footnote links, mainly for accessibility purpose.

- **rehype-html-blocks**

  This plugin wraps (multi-line) raw HTML in `p`.

- **remark-align**

  This plugin parses custom Markdown syntax to center- or right-align elements.

- **remark-captions**

  Allow to add caption to such element as image, table or blockquote.

- **remark-comments**

  This plugin parses custom Markdown syntax for Markdown source comments.

- **remark-custom-blocks**

  This plugin parses custom Markdown syntax to create new custom blocks.

- **remark-emoticons**

  This plugins replaces ASCII emoticons with associated image. Compatible with [rehype][rehype]

- **remark-escape--escaped**

  This plugin escapes HTML entities from Markdown input.

- **remark-grid-tables**

  This plugin parses custom Markdown syntax to describe tables.

- **remark-heading-shift**

  Allows to shift heading to custimize the way you will integrate the generated tree inside your application.

- **remark-heading-trailing-spaces**
  This plugin removes trailing spaces from Markdown headers.

- **remark-iframes**

  Allows to add `iframe` inclusion through `!(url)` code.

- **remark-kbd**

  This plugin parses custom Markdown syntax to handle keyboard keys.

- **remark-numbered-footnotes**

  This plugin changes how [mdast][mdast] footnotes are displayed by using sequential numbers as footnote references instead of user-specified strings.

- **remark-sub-super**

  This plugin parses custom Markdown syntax to handle subscript and superscript.

- **typographic-colon**

  Micro module to fix a common typographic issue that is hard to fix with most keyboard layouts.

- **typographic-permille**

  Micro module to replace `%o` with `‰` and optionally replace the preceding space.
