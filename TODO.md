# TODO

## @TODO: Use Confetti on CTA forms

`canvas-confetti`
https://github.com/catdad/canvas-confetti
https://www.kirilv.com/canvas-confetti/

## @TODO: Use the Page Visibility API to pause videos, image carousels, and animations

Stop unnecessary processes when the user doesn’t see the page or inversely to perform background actions.

## @TODO: "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

https://github.com/add2cal/add-to-calendar-button
https://add-to-calendar-button.com/

## @TODO: Add Check HTML Links to test workflow

npm i -D check-html-links
npx check-html-links _site
https://github.com/modernweb-dev/rocket/tree/main/packages/check-html-links

## @TODO: Provide button to turn off animation in Hero

"Scaling/zooming animations are problematic for accessibility, as they are a common trigger for certain types of migraine. If you need to include such animations on your website, you should provide a control to allow users to turn off animations, preferably site-wide.  Also, consider making use of the prefers-reduced-motion media feature — use it to write a media query that will turn off animations if the user has reduced animation specified in their system preferences. "

## @TODO: Handle `@media (prefers-reduced-motion: reduce)`

Stop the Hero Greensocks animation when `@media (prefers-reduced-motion: reduce)`, using `window.mediaQuery()`. Handle user preference for reduced motion on animations, doing this also with a listener like for browser theme preference

```css
@media (prefers-reduced-motion) {
  /* styles to apply if the user's settings are set to reduced motion */
}
```

```typescript
const mediaQueryList = window.matchMedia('(prefers-reduced-motion)') // not sure what the inverse is to match for so that there's a listener for both the prefers-reduced-motion state and the doesn't-care state
mediaQueryList.addEventListener(event => {
  if (event.type === 'change') {}
})
```

## @TODO: Set up webmentions

This code goes in `_layouts/layouts/base.njk` after the last `<script>` tag in the document `<body>`:

```nunjucks
{%- if layout == 'layouts/articles/item' -%}
  <script src="{{ '/assets/scripts/webmentions.js' | url }}" defer></script>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
{%- endif -%}
```

There's a filter roughed out for the webmentions.

## @TODO: SCSS Use clothoid corners with border-radius

https://onotakehiko.dev/clothoid/

`@TODO: SCSS Make sure accent-color or styling for checkboxes/radio button groups is set up. Sets the colour used by checkboxes and radio buttons, as well as range fields and progress indicators. The accent colour is inherited`

```scss
:root{
  accent-color : #696;
}
```

## @TODO: SCSS Replace all `:focus pseudoselectors` with `:focus-visible`

```css
/* Focusing the button with a keyboard will show a dashed black line. */
button:focus-visible {
  outline: 4px dashed black;
}

/* Focusing the button with a mouse, touch, or stylus will show a subtle drop shadow. */
button:focus:not(:focus-visible) {
  outline: none;
  box-shadow: 1px 1px 5px rgba(1, 1, 0, .7);
}
```

## @TODO: Refactor modals

Modals should be wrapped in the `<dialog>` element and use programmatic methods to display - `showModal()` to disable the area outside of the modal (handles `esc` keypress natively) and `show()` to allow interaction outside the modal, along with `close()`.

## @TODO: Fix Favicon workflow

Right now, the `eleventy-favicon` plugin is used to generate `favicon.ico`, `favicon.svg`, and `apple-touch-icon.png` in the root directory. It provides a shortcode to use for outputting
`<link>` markup in the document head:

```nunjucks
{% favicon buildPaths.faviconSvgSourceFilename %}
```

The shortcode generates this markup, notice the iOS-specific `rel` type in the third link:

```html
<link rel="icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

SVG favicons are only supported across 74% of browsers. We have to provide a fallback version for Internet Explorer and Safari.

The plugin functionality for generating favicons should be moved to a Gulp task, and the HTML markup hard coded in `_layouts/components/head/meta.njk` so that the `<link>` tags can use conditional
media queries based on whether the user has a preference for dark mode set and their browser title
bar is therefore in a dark theme:

```html
<link
  href="/favicon--default.ico"
  rel="icon"
  media="(prefers-color-scheme: light)"
/>
<link
  href="/favicon--dark-theme.ico"
  rel="icon"
  media="(prefers-color-scheme: dark)"
/>
```

```typescript
// select the favicon 👉
const faviconEl = document.querySelector('link[rel="icon"]')

// watch for changes 🕵️
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', themeChange)

// listener 👂
function themeChange(event) {
  if (event.matches) {
    faviconEl.setAttribute('href', 'favicon-dark.png')
  } else {
    faviconEl.setAttribute('href', 'favicon-light.png')
  }
}
```

## @TODO: Theme preference handling

Are we listening for an event that the user changes their browser's theme preference, and updating our theme if they do? And is the initial theme of our site set based on the browser's theme preference? Use a listener for browser theme preference.

```css
@media (prefers-color-scheme: dark) {}
@media (prefers-color-scheme: light) {}
```

```typescript
const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
mediaQueryList.addEventListener(event => {
  if (event.type === 'change') {}
})
```

## @TODO: Add for iOS

Specifying a Launch Screen Image

On iOS, similar to native applications, you can specify a launch screen image that is displayed while your web application launches. This is especially useful when your web application is offline. By default, a screenshot of the web application the last time it was launched is used. To set another startup image, add a link element to the webpage, as in:

```html
<link rel="apple-touch-startup-image" href="/launch.png">
```

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

### [Relative Time](https://github.com/BryceRussell/astro-github-elements/tree/main/packages/time#readme)

Astro wrapper for GitHub's relative time web component. Translates dates to past or future time phrases, like "*4 hours from now*" or "*20 days ago*".

### [TextCircle](https://github.com/LoStisWorld/astro-textcircle#astro-textcircle)

Display text in a circular layout.

## Markdown

### [`astro-code-blocks`](https://www.npmjs.com/package/@thewebforge/astro-code-blocks)

Custom version of the code block integration from Astro Docs. "Beautiful code blocks for your Astro site". Applied to the code blocks created in `.mdx` files.

### [MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/) (**`installed`**)

Allows importing `.mdx` files in `.astro` files or collections.

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

## Search

Lunr is a JS search library using an inverted index. Client-side search for statically hosted pages.

### [`@jackcarey/astro-lunr`](https://www.npmjs.com/package/@jackcarey/astro-lunr)

### [`@siverv/astro-lunr`](https://www.npmjs.com/package/@siverv/astro-lunr)

## SEO

## Sitemap

Astrolib's version automatically creates a link to the sitemap in the `<head>` section of generated pages.

### [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/)

Generates a sitemap based on your pages when you build your Astro project.


- **`eleventy-plugin-sitemap`**

Provides a shortcode to generate a sitemap.xml file using _generate/sitemap.njk

- downloads content pages should not be added to the sitemap

## Site Pages (robots)

Downloads site pages should not be indexed by search engines

### [`astro-robots`](https://www.npmjs.com/package/astro-robots#astro-robots)

Generates a `robots.txt` for your Astro project during build. Uses up-to-date [Verified Bots](https://radar.cloudflare.com/traffic/verified-bots) support from CloudFlare.

### [`astro-robots-txt`](https://www.npmjs.com/package/astro-robots-txt)

Generates a `robots.txt` for your Astro project during build.

### [`astro-webmanifest`](https://www.npmjs.com/package/astro-webmanifest)

Generates a web application manifest for a Progressive Web App (PWA), favicon, icons and inserts appropriate html into `<head>` section for your Astro project during build.

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

# SEO

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

## Lighthouse

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
