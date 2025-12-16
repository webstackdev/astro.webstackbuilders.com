<!-- markdownlint-disable-file -->
# TODO

## Refactor API Endpoints to Astro Actions

### Action / Domain / Responder Pattern

- The action takes HTTP requests (URLs and their methods) and uses that input to interact with the domain, after which it passes the domain's output to one and only one responder.

**Here you define the route and the methods (get, post, put, delete)**

`/actions` or `actions.ts`

- This layer contains the business logic and the persistence logic (e.g., using a repository pattern or similar data mappers). The domain services are responsible for reading from and writing to the database to fulfill business requirements.

`/domain`

- The Domain is an entry point to the domain logic forming the core of the application, modifying state and persistence as needed. This may be a Transaction Script, Service Layer, Application Service, or something similar. The Domain in ADR relates to the whole of the domain objects, all the entities and their relations as a whole

`/entities` or `entities.ts`

- Entities are part of the domain. They represent state and core business rules, but not persistence logic. Defined primarily by its unique identity, rather than its attributes or properties.

- By any name the Domain Payload Object is a specialized Data Transfer Object. A Data Transfer Object is a fine-grained object, providing properties that mirror or at least shadow properties found on the domain objects that they replicate. A Domain Payload Object is a coarse-grained object that transfers whole domain object instances to the client.

`/responders` or `responders.ts`

- The responder builds the entire HTTP response from the domain's output which is given to it by the action. The Responder is responsible solely for formatting the final response (e.g., JSON, HTML) to be sent back to the client.

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

See the example image in Social Shares. The social shares UI on mobile should be a modal that slides in from the bottom.

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Analytics

Vercel Analytics

- Highlighter component
- Social Shares component
- Social Embeds: Track embed interactions
- Cookie Consent
- Download Form component

npm i @vercel/analytics
import Analytics from '@vercel/analytics/astro'
https://vercel.com/docs/analytics/quickstart#add-the-analytics-component-to-your-app

## Themepicker tooltips, extra themes

- Add additional themes
- Add tooltip that makes use of the description field for the theme, explaining what the intent of the theme is

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

## "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

`https://github.com/add2cal/add-to-calendar-button`
`https://add-to-calendar-button.com/`

## Set up webmentions

Needs to add real API key and test

- Get API token from webmention.io
- Add WEBMENTION_IO_TOKEN to .env
- (Optional) Set up Bridgy for social media
- Test with sample webmentions

## Astro wrapper for the `@github/clipboard-copy-element` web component. Copies element text content or input values to the clipboard

[`clipboard-copy`](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/clipboard-copy#astro-github-elementsclipboard-copy)

## Astro wrapper for GitHub's relative time web component. Translates dates to past or future time phrases, like "*4 hours from now*" or "*20 days ago*"

[Relative Time](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/time#readme)

## Display text in a circular layout

[TextCircle](https://github.com/LoStisWorld/astro-textcircle#astro-textcircle)

## Custom Directives

[`astro-directives`](https://github.com/QuentinDutot/astro-directives)

```react
<Component client:hover />
```

| Attribute     | Load the javascript and hydrate on ... |
| ------------- | -------------------------------------- |
| client:click  | element click event                    |
| client:hover  | element mouseover event                |
| client:scroll | window scroll event                    |

## Prefetch Links

The default prefetch strategy when adding the data-astro-prefetch attribute is hover. To change it, you can configure prefetch.defaultStrategy in your astro.config.mjs file.

hover (default): Prefetch when you hover over or focus on the link.
tap: Prefetch just before you click on the link.
viewport: Prefetch as the links enter the viewport.
load: Prefetch all links on the page after the page is loaded.

```html
<a href="/about" data-astro-prefetch>
<a href="/about" data-astro-prefetch="tap">About</a>
```

If you want to prefetch all links, including those without the data-astro-prefetch attribute, you can set prefetch.prefetchAll to true:

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  prefetch: {
    prefetchAll: true
  }
})
```

You can then opt-out of prefetching for individual links by setting data-astro-prefetch="false":

```html
<a href="/about" data-astro-prefetch="false">About</a>
```

## Markdown

Next I'd like to add a series of Unified plugins to our stack, one by one. I'll install the package and give you a link to its NPM docs page. For each one:

1. Add it to our configuration in src/lib/config/markdown.ts
2. Add an example usage in src/content/articles/demo/index.mdx
3. I'll QA it in a browser visually
4. Add unit, integration, and e2e tests for it in src/lib/markdown
5. Run npm run test:unit and fix any errors
6. Add it to the src/content/test-fixtures/markdown/index.mdx test fixture
7. Add a Playwright E2E test for it in test/e2e/specs/04-components/markdown.spec.ts
8. Run the test and fix any errors
9. Run npm run lint and npm run check and fix any errors

The first plugin is rehype-external-links. It should be configured to add `target="_blank" rel="noreferrer"` to all external links in MDX files.

https://www.npmjs.com/package/rehype-external-links

### Custom plugins

- `remark-replacements` - Heading anchor links
- `rehype-tailwind` - Add custom CSS classes to Markdown-generated elements in this file

### Markdown Not Working

- color tabs like GFM when using HEX, RGB, or HSL values in backticks. This should generate a callout box around the hex color with a dot to the right showing the color.
- Astro also includes shiki
- We're adding 'rehype-autolink-headings', but Astro does too: https://docs.astro.build/en/guides/markdown-content/#heading-ids-and-plugins
- Youtube embedding - could use a custom component or `remark-iframes`
- `remark-attributes` does not work because `{...}` in MDX embeds dynamic JavaScript logic or JSX components directly within Markdown content

```markdown
![Image](url){width=300 .centered}

Variables: # {postTitle}.
Calculations: {Math.PI * 2}.
Components: { <MyComponent /> }
```

### Custom version of the code block integration from Astro Docs. "Beautiful code blocks for your Astro site". Applied to the code blocks created in `.mdx` files

[`astro-code-blocks`](https://www.npmjs.com/package/@thewebforge/astro-code-blocks)

### `rehype-external-links`

npm install rehype-external-links

Adds `target="_blank" rel="noreferrer"` to all external links in Markdown files

```typescript
rehypePlugins: [
  [
    rehypeExternalLinks,
    {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    },
  ],
]
```

- **LATEX**

 rebber - transformation of MDAST into `latex` code. This code must be included inside a custom latex to be compiled.

 Have a look at `https://github.com/zestedesavoir/latex-template/blob/master/zmdocument.cls` to get a working example.

### `remark-align`

This plugin parses custom Markdown syntax to center- or right-align elements. Alignment is done by wrapping something in arrows indicating the alignment:

```markdown
->paragraph<-

->paragraph->
```

produces:

```html
<div class="some-class"><p>paragraph</p></div>
<div class="some-other-class"><p>paragraph</p></div>
```

```typescript
.use(remarkAlign, {
  right: 'align-right',
  center: 'align-center'
})
```

### `@adobe/remark-gridtables`

```markdown
+-------------------+------+
| Table Headings    | Here |
+--------+----------+------+
| Sub    | Headings | Too  |
+========+=================+
| cell   | column spanning |
| spans  +---------:+------+
| rows   |   normal | cell |
+---v----+:---------------:+
|        | cells can be    |
|        | *formatted*     |
|        | **paragraphs**  |
|        | ```             |
| multi  | and contain     |
| line   | blocks          |
| cells  | ```             |
+========+=========:+======+
| footer |    cells |      |
+--------+----------+------+
```

### `remark-numbered-footnotes`

This plugin replaces the footnote references with a number sequence (starting from 1) in the same order as the footnote definitions (not the footnote references).

Reordering the definitions (usually put at the end of the document in the Markdown source) will therefore let you reorder the sequence.

This is useful if you want your footnotes to be superscript numbers without having to manually enter them while keeping the benefit of using strings that make sense to you in your Markdown source.

### `rehype-footnotes-title`

This plugin adds a `title` attribute to the footnote links, mainly for accessibility purpose:

```html
<a href="#fnref-1" class="footnote-backref" title="Jump to reference">↩</a>
```

```typescript
.use(footnotesTitles, 'Jump to reference')
.use(footnotesTitles, 'Going back to footnote with id $id')
```

- **remark-sub-super** DO WE HAVE THIS NOW?

  This plugin parses custom Markdown syntax to handle subscript and superscript.

- **Also underline.**

- **remark-captions**

  Allow to add caption to such element as image, table or blockquote.

- **remark-custom-blocks**

  This plugin parses custom Markdown syntax to create new custom blocks.

- **KATEX**

Math markup

### Details/Summary elements

These HTML elements aren't being processed by remarkGfm (they need to be raw HTML). Expandable and collapsible content using HTML <details> and <summary> elements.

`rehype-details`

### Definition lists

using indented ~ for definitions under definition header

`markdown-it-deflist`

### Add ==highlighted== syntax

1. add remark-mark plugin
2. Remove skip from integration test in

### Add accessible name to section in footnotes plugin

    const markdownFootnoteBlockOpen = () =>
    '<hr className="footnotes-sep">\n' +
    '<section class="footnotes" aria-label="footnotes">\n' +
    '<ol class="footnotes-list">\n'

### Code tabs plugin so Javascript and Typescript examples can both be show.

There can only be white space between two code blocks. Display name is set by `tabName` and can only contain characters in [A-Za-z0-9_]. Syntax for the first line of the code block is:

```js [group:tabName]
```

`markdown-it-codetabs`

### Add copy button to code blocks

`markdown-it-copy`

Options for "copy" button added to code blocks

```javascript
const markdownCodeCopyConfig = {
  /** Text shown on copy button */
  btnText: `Copy`,
  /** Text shown on copy failure */
  failText: `Copy Failed`,
  /** Text shown on copy success */
  successText: `Success!`, // 'copy success' | copy-success text
  /** Amount of time to show success message */
  successTextDelay: 2000,
  /** An HTML fragment included before <button> */
  extraHtmlBeforeBtn: ``,
  /** An HTML fragment included after <button> */
  extraHtmlAfterBtn: ``,
  /** Whether to show code language before the copy button */
  showCodeLanguage: false,
  /** Test to append after the copied text like a copyright notice */
  attachText: ``,
}
```

### Apache ECharts interactive charting and data visualization library for browser

@TODO: uses ES Modules, needs Jest config adjusted. See note in Mermaid plugin spec file.

`markdown-it-echarts`

### Add captions to markdown images

```markdown
![xx](yy "my caption") shows `my caption` as the caption
```

`markdown-it-image-caption`

### Includes for markdown fragment files using !!![file.md]!!! syntax

`markdown-it-include`

### Syntax highlighting for marked text

```
==marked== => <mark>inserted</mark>
```

`markdown-it-mark`

### Add Twitter like mentions in markdown using @twittername syntax

`markdown-it-mentions`

Options object including parse function for content generated by mentions plugin using `@twittername` syntax:

```javascript
const markdownMentionsConfig = {
  parseURL: username => {
    return `https://twitter.com/@${username}`
  },
  /** adds a target="_blank" attribute if it's true and target="_self" if it's false */
  external: true,
}
```


### TeX rendering using KaTeX for math symbols

`markdown-it-texmath`

```typescript
const markdownTexmathConfig = {
  engine: require('katex'),
  delimiters: 'dollars',
  katexOptions: { macros: { '\\RR': '\\mathbb{R}' } },
}
```

- `remark-math`: A Remark plugin that parses LaTeX syntax within your Markdown files.
- `rehype-katex` or `rehype-mathjax`: Rehype plugins that convert the parsed LaTeX into rendered HTML using either KaTeX or MathJax, respectively. KaTeX is often preferred for its performance and ability to allow text selection.

### Mermaid JavaScript based diagramming and charting tool

@TODO: uses ES Modules, needs Jest config adjusted. See note in spec file.

`@liradb2000/markdown-it-mermaid`

```typescript
const markdownMermaidConfig = {
  startOnLoad: false,
  securityLevel: true,
  theme: 'default',
  flowchart: {
    htmlLabels: false,
    useMaxWidth: true,
  },
  dictionary: {
    token: 'mermaid',
    graph: 'graph',
    sequenceDiagram: 'sequenceDiagram',
  },
  // ...or any other options
}

markdown.syntaxHighlight.excludeLangs
Type: Array<string>
Default: ['math']
```

### Excluded Languages

An array of languages to exclude from the default syntax highlighting specified in markdown.syntaxHighlight.type. This can be useful when using tools that create diagrams from Markdown code blocks, such as Mermaid.js and D2.

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math'],
    },
  },
})
```

/** Add a curtain filename block into code blocks using ```js:<filename.js> syntax */
// @TODO: conflicts with markdown-it-codetabs, need to debug
//// markdown-it-named-code-blocks//

/** Textmark-based parsing of code blocks using VS Code templates */
// @TODO: gives error, maybe about ES Module syntax: TypeError: plugin.apply is not a function
//// markdown-it-shiki'), markdownShikiConfig)

/** Subscript text: 29^th^ => <p>29<sup>th</sup></p> */
// markdown-it-sub//

/** Superscript text: H~2~0 => <p>H<sub>2</sub>0</p> */
// markdown-it-sup//

/** Adds underline to markdown like _underline_ */
// @TODO: conflicts with built-in markup for italics: _italics_ _underline_, change one
//// markdown-it-underline//

/** Embed video: @[youtube](dQw4w9WgXcQ) */
// markdown-it-video'), markdownVideoConfig)
/**
 *
 */
/*const markdownVideoConfig = {
  youtube: { width: 640, height: 390 },
}*/

/*
 call out colors within a sentence by using backticks like Github-Flavored Markup on Github. A supported color model within backticks will display a visualization of the color.

The background color is `#ffffff` for light mode and `#000000` for dark mode.

The above will generate a callout box around the hex color with a dot to the right showing the color.
*/

// Alerts: Use specific block formats for different types of alerts, such as > [!IMPORTANT] or > [!WARNING].

### Attribution

`markdown-it-attribution`

```markdown
<attribution>
This is some text that needs an attribution.
</attribution>
```

### my-accessible-list-plugin

```typescript
import { visit } from 'unist-util-visit';

export function myAccessibleListPlugin() {
  return (tree) => {
    visit(tree, 'list', (node) => {
      // Example: Add an aria-label to lists
      if (!node.data) {
        node.data = {}
      }
      if (!node.data.hProperties) {
        node.data.hProperties = {}
      }
      node.data.hProperties['aria-label'] = 'List of items'; // Customize this
    })
  }
}
```
