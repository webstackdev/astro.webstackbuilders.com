# Astro 3rd-Party Integrations

## Eleventy Migration

Eleventy plugins that don't yet have identified equivalents for Astro.

- **`eleventy-plugin-inclusive-language`**

Outputs command line warnings for weasel words like "obviously", "basically", etc.

```'simply,obviously,basically,of course,clearly,just,everyone knows,however,easy'```

- **`eleventy-plugin-rss`**

RSS feed generator, adds shortcode filters absoluteUrl, dateToRfc3339, dateToRfc822.

- **`eleventy-plugin-social-images`**

Generates images as headers for use in social shares

- **`eleventy-plugin-schema`**

Provides a shortcode to generate a JSON-LD script per-page including the `<script>` tag.

- **`eleventy-plugin-sitemap`**

Provides a shortcode to generate a sitemap.xml file using _generate/sitemap.njk

- **`eleventy-plugin-external-links`**

Adds `target="_blank" rel="noreferrer"` to all external links

- **`eleventy-plugin-emoji`**

Accessible emoji shortcode and filter. Usage:

```{% emoji "⚙️", "settings gear" %} or {{ "⚙️" | emoji: "settings gear" }}```

- **`eleventy-plugin-nesting-toc`**

Generates a nested table of contents for use in an aside from page contents.

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

- **`eleventy-plugin-share-highlight`**

Element embedded in a 'highlight' paired shortcode will bring up share options on hover, and insert the quoted text and a link to the current page on click. You can share it on any platform that registers as a share target. Like Medium.

Option to set Tooltip label text for shares ("Share this").

- **`eleventy-plugin-time-to-read`**

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

## Analytics

### [Astro Analytics](https://www.npmjs.com/package/astro-analytics)

Adds code snippets for popular analytics services, including GA.

## Build System

### [Critters](https://github.com/GoogleChromeLabs/critters) Critical CSS inliner by Google

Designed for SSG. SSR doesn't use.

### [astro-svg-sprite](https://www.npmjs.com/package/astro-svg-sprite) (**`installed`**)

Bundle directories of SVG images up into a single sprite file and provide a custom `<Sprite />` component to access them.

Usage:

```react
---
import Sprite from 'components/Sprite.astro'
---
<Sprite name="fileName" class="customClassName"/>
```

### [Tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/) (**`installed`**)

## Comments

## Compression

### [AstroCompress Minifier](https://github.com/astro-community/AstroCompress)

Runs Sharp to compress images, Terser for HTML minification, CSSO for CSS minification, and SVGO for SVG optimization.

### [`astro-compressor`](https://www.npmjs.com/package/astro-compressor)

Gzip and Brotli file compressor for static builds. SSR compression requires setting up middleware (notes on project page). Handles CSS, HTML, JS, SVGs, XML, and others.

## Components

### [`astro-carousel`](https://github.com/claudiabdm/astro-carousel)

Accessible carousel component for Astro that works by using browser navigation.

### [`astro-emoji`](https://github.com/seanmcp/astro-emoji#astro-emoji)

An accessible Emoji component. Wraps emojis in a `<span>` with `aria-label` or `aria-hidden`, and `role` attributes.

### [`astro-toc`](https://github.com/theisel/astro-toc#readme)

Table of Contents (ToC) generator.

### [`npm install astro-breadcrumbs`](https://docs.astro-breadcrumbs.kasimir.dev/start-here/getting-started/)

Usage:

```astro
---
import { Breadcrumbs } from "astro-breadcrumbs";

import "astro-breadcrumbs/breadcrumbs.css";

// or import the scss file
// import "astro-breadcrumbs/breadcrumbs.scss";
---

<Breadcrumbs />
```

### [`clipboard-copy`](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/clipboard-copy#astro-github-elementsclipboard-copy)

Astro wrapper for the `@github/clipboard-copy-element` web component. Copies element text content or input values to the clipboard.

### [Flow](https://github.com/astro-community/flow)

Components for control like `<For>`, `<When>` with two conditions, and `<switch>` and `<Case>`.

### [Relative Time](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/time#readme)

Astro wrapper for GitHub's relative time web component. Translates dates to past or future time phrases, like "*4 hours from now*" or "*20 days ago*".

### [TextCircle](https://github.com/LoStisWorld/astro-textcircle#astro-textcircle)

Display text in a circular layout.

## Images

### [Astro - ImageKit integration + component](https://www.npmjs.com/package/astro-imagekit)

Imagekit is a SaaS video and image optimization service, DAM, and CDN.

### [astro-mapped-images](https://github.com/techaurelian/astro-mapped-images#astro-mapped-images)

An Astro image component that handles both local and external images and includes the correct width and height attributes using pre-generated  image maps.

## Markdown

### [`astro-code-blocks`](https://www.npmjs.com/package/@thewebforge/astro-code-blocks)

Custom version of the code block integration from Astro Docs. "Beautiful code blocks for your Astro site". Applied to the code blocks created in `.mdx` files.

### [MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/) (**`installed`**)

Allows importing `.mdx` files in `.astro` files or collections.

### [Markdoc](https://www.npmjs.com/package/@astrojs/markdoc)

Maintained by Astro project, marked experimental. Created by Stripe for their public docs. Adds shortcodes to Markdown:

```markdown
{% callout type="note" %}
```

> Markdoc allows you to enhance your Markdown with Astro components. If you have existing content authored in Markdoc, this integration  allows you to bring those files to your Astro project using content  collections.

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

## Nativation

### [`astro-navigation`](https://www.npmjs.com/package/@prosellen/astro-navigation)

Create a navigation structure from a JSON object.

## Search

Lunr is a JS search library using an inverted index. Client-side search for statically hosted pages.

### [`@jackcarey/astro-lunr`](https://www.npmjs.com/package/@jackcarey/astro-lunr)

### [`@siverv/astro-lunr`](https://www.npmjs.com/package/@siverv/astro-lunr)

## SEO

## Sitemap

Astrolib's version automatically creates a link to the sitemap in the `<head>` section of generated pages.

### [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/)

Generates a sitemap based on your pages when you build your Astro project.

## Site Pages (robots)

### [`astro-robots`](https://www.npmjs.com/package/astro-robots#astro-robots)

Generates a `robots.txt` for your Astro project during build. Uses up-to-date [Verified Bots](https://radar.cloudflare.com/traffic/verified-bots) support from CloudFlare.

### [`astro-robots-txt`](https://www.npmjs.com/package/astro-robots-txt)

Generates a `robots.txt` for your Astro project during build.

### [`astro-webmanifest`](https://www.npmjs.com/package/astro-webmanifest)

Generates a web application manifest for a Progressive Web App (PWA), favicon, icons and inserts appropriate html into `<head>` section for your Astro project during build.

### [`vanilla-cookieconent + Astro Integration`](https://www.npmjs.com/package/@jop-software/astro-cookieconsent)

Cookie Consent modal and handler.

## Social Share

### [astro-social-share](https://github.com/silent1mezzo/astro-social-share#readme)

## Social Media Preview Generators

There are several integrations available that vary based on the library they use to create an image file to snapshot, whether they allow the template for generating the image to be modified, and what options they provide for output.

### [`astro-og-canvas`](https://www.npmjs.com/package/astro-og-canvas)

- Most popular option (~660 weekly d/l). Generates images at **run time**.
- Uses **`canvaskit-wasm`** for rendering
- Uses plain color or gradient background. Provide title, description, and logo (displayed at top left of card).
- Can't set size of final card.

### [`astro-satori`](https://www.npmjs.com/package/astro-satori)

- Moderately popular option (~230 weekly d/l). Generates images at **run time**.
- Uses Vercel's **Satori** library for rendering (entirely done in JS with limitations on what CSS can be used). Satori is a library for generating SVG strings from pure HTML and CSS.
- Size of final card can be set.
- Seems opinionated, but it might be possible to have a lot of control (not sure).
- Output format?

### [`astro-opengraph-image`](https://www.npmjs.com/package/@altano/astro-opengraph-image#fn-filename-change)

- Uses **Satori**. Has dependencies on [`@resvg/resvg-wasm`](https://www.npmjs.com/package/@resvg/resvg-wasm) and Sharp. Middleware integration. Generates images at **run time**.
- Provides element to add OG tags in document `<head>`.
- Very flexible, you can provide the Astro template to generate the card.

### [Astro Open Graph Image](https://www.npmjs.com/package/astro-og-image)

- Uses **Puppeteer**. Generates images at **build time**.
- You can provide the Astro template to generate the card.
- Requires providing a `baseHead` property in page templates.

### [Astro Open Graph Image Generator](https://www.npmjs.com/package/@cyberkoalastudios/og-image-generator)

- Uses **Puppeteer**. Has dependencies on [`canvaskit-wasm`](https://www.npmjs.com/package/@resvg/resvg-wasm) and Sharp.
- You can set the background image. No option to set the size of the card.
- Manually add OF properties on `<head>` element. Flexible.
