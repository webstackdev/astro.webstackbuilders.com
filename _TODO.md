<!-- markdownlint-disable-file -->
# TODO

continue

## Refactor API Endpoints to Astro Actions

### Action / Domain / Responder Pattern

- The action takes HTTP requests (URLs and their methods) and uses that input to interact with the domain, after which it passes the domain's output to one and only one responder.

**Here you define the route and the methods (get, post, put, delete)**

`/actions` or `actions.ts`

- This layer contains the business logic and the persistence logic (e.g., using a repository pattern or similar data mappers). The domain services are responsible for reading from and writing to the database to fulfill business requirements.

`/domain`

- Entities are part of the domain. They represent state and core business rules, but not persistence logic. Defined primarily by its unique identity, rather than its attributes or properties.

Is an entry point to the domain logic forming the core of the application, modifying state and persistence as needed. This may be a Transaction Script, Service Layer, Application Service, or something similar.

`/entities` or `entities.ts`

- The responder builds the entire HTTP response from the domain's output which is given to it by the action. The Responder is responsible solely for formatting the final response (e.g., JSON, HTML) to be sent back to the client.

`/responders` or `responders.ts`


### Endpoints:

- cron/cleanup-confirmations → GET
- cron/cleanup-dsar-requests → GET
- cron/run-all → GET
- social-card/ → GET

- contact/ → POST (contact form submission) and OPTIONS (CORS pre-flight)
- downloads/submit → POST
- gdpr/consent → POST, GET, DELETE
- gdpr/request-data → POST
- gdpr/export → GET
- gdpr/verify → GET
- health/ → GET
- newsletter/ → POST, OPTIONS
- newsletter/confirm → GET

### Files importing from `astro:db`

- _utils/rateLimit.ts
- _utils/rateLimitStore.ts
- cron/cleanup-confirmations.ts
- cron/cleanup-dsar-requests.ts
- gdpr/_utils/consentStore.ts
- gdpr/_utils/dsarStore.ts
- newsletter/_token.ts

### Cross-endpoint dependencies:

gdpr: Mostly self-contained, but `verify.ts` does import `deleteNewsletterConfirmationsByEmail` from `@pages/api/newsletter/_token` (line 15). That's a direct dependency on the newsletter code.

newsletter: `confirm.ts` pulls `markConsentRecordsVerified` from `@pages/api/gdpr/_utils/consentStore` (line 10) to mark double opt-in consent. That's the reciprocal dependency.

Newsletter hits the gdpr consent endpoint using `recordConsent` in `src/pages/api/_logger/index.ts`.

If we want to make it feel less inconsistent, we could either (a) rename `_logger` to something like `_consentClient` so its purpose is clearer, or (b) move to a microservices architecture and expose a protected `/api/gdpr/verify` endpoint and have newsletter call it over HTTP as well - but that would need additional auth to prevent abuse.

**Affected components:**

- CallToAction/Newsletter
- ContactForm

## Mobile Social Shares UI

See the example image in Social Shares.

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Analytics

Vercel Analytics

## Themepicker tooltips, extra themes

- Add additional themes
- Add tooltip that makes use of the description field

## Sentry feedback, chat bot tying into my phone and email

See note in src/components/scripts/sentry/client.ts - "User Feedback - allow users to report issues"

## Uppy file uploads from contact form

docs/CONTACT_FORM.md

Where to upload to?

## Search

Add Upstash Search as a Vercel Marketplace Integration.

Lunr is a JS search library using an inverted index. Client-side search for statically hosted pages.

### [`@jackcarey/astro-lunr`](https://www.npmjs.com/package/@jackcarey/astro-lunr)

### [`@siverv/astro-lunr`](https://www.npmjs.com/package/@siverv/astro-lunr)

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## Color vars

brand primary:    #001733
brand secondary:  #0062B6

ring (1px), ring-2, ring-4
accent

text-white, other default Tailwind colors

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

## Use Confetti on CTA forms

`canvas-confetti`
`https://github.com/catdad/canvas-confetti`
`https://www.kirilv.com/canvas-confetti/`

## Use the Page Visibility API to pause videos, image carousels, and animations

Stop unnecessary processes when the user doesn't see the page or inversely to perform background actions.

## "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

`https://github.com/add2cal/add-to-calendar-button`
`https://add-to-calendar-button.com/`

## Set up webmentions

Needs to add real API key and test

## SCSS Use clothoid corners with border-radius

`https://onotakehiko.dev/clothoid/`

`SCSS Make sure accent-color or styling for checkboxes/radio button groups is set up. Sets the colour used by checkboxes and radio buttons, as well as range fields and progress indicators. The accent colour is inherited`

```scss
:root{
  accent-color : #696;
}
```

## Refactor modals

Modals should be wrapped in the `<dialog>` element and use programmatic methods to display - `showModal()` to disable the area outside of the modal (handles `esc` keypress natively) and `show()` to allow interaction outside the modal, along with `close()`.

## Add for iOS

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

## Refactor social neworks in Authors collection to Contact collection format

The contact data collection uses an array of social networks, with keys:

```
{
  network: z.string(),
  name: z.string(),
  url: z.string().url(),
  order: z.number(),
}
```

The authors collection is using named entries under a "social" property, like "twitter", "github", etc. This task is to refactor that to use an array like contact data collection. We also need to add a color for the social network icon, or some other approach to setting the color of it while enabling theming.

We should also make sure the avatar key in the authors collection is being output as a responsive image tag.

## Add Google Maps screenshot (or maps embed) to Contact Page

src/assets/images/map.webp

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
