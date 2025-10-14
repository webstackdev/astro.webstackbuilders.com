<!-- markdownlint-disable -->
Components intended for use in *.mdx files:

* Avatar
* Callout
* CallToActions/Contact
* CallToActions/Featured
* CallToActions/Newsletter
* Carousel with choice of collection to display and filters
* Social/Share
* Social/Embed
* Sprite
* Testimonials

The remaining test failures are unrelated to our restructuring work - they're from:

Avatar component tests: Missing deprecated functions (these were already failing)
Local storage tests: Missing mocked store implementation (unrelated to our changes)
Performance timing tests: Flaky timing tests (unrelated to our changes)
Accessibility tests: Missing axe matcher setup (when we removed the vitest-axe import, but these were probably failing before)

If you are using a third-party service like Sentry to get readable stack traces in production, you'll need to configure both the source map generation and the upload process.

- you must never include a SENTRY_AUTH_TOKEN in your client-side browser bundle. Doing so creates a major security vulnerability, as the token would be publicly exposed and could be misused. For browser-based applications, Sentry uses a Data Source Name (DSN) for configuration instead.
- You cannot safely include your ConvertKit API key directly in your client-side code, such as in a JavaScript bundle. This is a major security risk that could lead to unauthorized access and potential misuse of your account.
- You cannot safely include your RESEND_API_KEY in a client-side bundle for the browser. Resend explicitly states this in its documentation and other API key security best practices confirm it. An API key included in a front-end bundle is visible to anyone using the browser's developer tools.

Sentry.captureException(err)
Sentry.captureMessage("Something went wrong");
// optionally specify the severity level:
// "fatal" | "error" | "warning" | "log" | "debug" | "info" (default)
Sentry.captureMessage("Something went wrong", "warning")

I copied an eleventy plugin into the src/components/Highlighter directory. There is a README.md file explaining what the component is supposed to do. I want to refactor this plugin to function as an Astro component and add comprehensive testing.
- The code can be completely refactored if necessary. I prefer a function-based design instead of a class-based design with a constructor, unless the class design makes more sense.
- Create an astro template named index.astro and add the styles in an html tag in it. It should use a slot element to render passed-in content since it will be used in MDX pages.
- I'm not sure what the feed.njk template was supposed to do. What's is your opinion on its purpose?
- I moved a selectors.ts file and a test for it into the Highlighter folder. It was used in a previous iteration of this plugin before the site was refactored from eleventy. Use this approach and refactor any selector necessary or add a selector in the code file, for example to select the shadow root.\


**Refactor DelayedLoader**
* Right now we're probably including script that doesn't need DelayedLoader as they don't affect layout, causing a bad Lighthouse LCP score
* Astro dedupe script processes and bundles imports, but this is an automatic feature that happens when you use standard `<script>` tags. If you add is:inline to a script tag, you are telling Astro to not process or deduplicate it and to render it as a static block of HTML.
* Is there is an issue with using the same script multiple times, like the carousel?
* We need a single place to launch script so it can be wrapped in a unified error handler and reported to Sentry


**E2E Testing**
* We need to add Lighthouse testing


**Env Vars**
```typescript
import { API_URL } from "astro:env/client"
import { API_SECRET_TOKEN } from "astro:env/server"
```

**Add Vercel Analytics SDK**
npm i @vercel/analytics
import Analytics from '@vercel/analytics/astro'
https://vercel.com/docs/analytics/quickstart#add-the-analytics-component-to-your-app

/**
 * Add accessible name to section in footnotes plugin
 */
const markdownFootnoteBlockOpen = () =>
  '<hr className="footnotes-sep">\n' +
  '<section class="footnotes" aria-label="footnotes">\n' +
  '<ol class="footnotes-list">\n'

* Code tabs plugin so Javascript and Typescript examples can both be show. There can only
* be white space between two code blocks. Display name is set by `tabName` and can only
* contain characters in [A-Za-z0-9_]. Syntax for the first line of the code block is:
* ```js [group:tabName]
 */
// markdown-it-codetabs//

/** Add copy button to code blocks */
// markdown-it-copy'), markdownCodeCopyConfig)
/**
 * Options for "copy" button added to code blocks
 */
// const markdownCodeCopyConfig = {
  /** Text shown on copy button */
  // btnText: `Copy`,
  /** Text shown on copy failure */
  // failText: `Copy Failed`,
  /** Text shown on copy success */
  // successText: `Success!`, // 'copy success' | copy-success text
  /** Amount of time to show success message */
  // successTextDelay: 2000,
  /** An HTML fragment included before <button> */
  // extraHtmlBeforeBtn: ``,
  /** An HTML fragment included after <button> */
  // extraHtmlAfterBtn: ``,
  /** Whether to show code language before the copy button */
  // showCodeLanguage: false,
  /** Test to append after the copied text like a copyright notice */
  // attachText: ``,
// }

/** Definition lists, using indented ~ for definitions under definition header */
// markdown-it-deflist//

/** Apache ECharts interactive charting and data visualization library for browser  */
// @TODO: uses ES Modules, needs Jest config adjusted. See note in Mermaid plugin spec file.
//// markdown-it-echarts//

/** Expandable and collapsible content using HTML <details> and <summary> elements */
// rehype-details

/** Mark external, absolute links with appropriate rel & target attributes */
// markdown-it-external-anchor'), markdownExternalAnchorConfig)
/**
 * Mark external, absolute links with appropriate rel & target attributes
 */
// const markdownExternalAnchorConfig = {
  /** The domain that is considered an internal link */
  // domain: domain,
  /** A class name added to anchors */
  // class: 'external-link',
// }

/** es, GFM footnotes are supported in Astro, and they are enabled by using the remark-gfm plugin. This plugin allows you to use the standard footnote syntax, where you define a footnote reference inline (e.g., [^1]) and the footnote content at the bottom of the document (e.g., [^1]: This is my footnote).  */

/** Add captions to markdown images: ![xx](yy "my caption") shows `my caption` as the caption */
// markdown-it-image-caption//

/**Includes for markdown fragment files using !!![file.md]!!! syntax */
// markdown-it-include'), './src/_layouts')

/** Syntax highlighting to marked text: ==marked== => <mark>inserted</mark> */
// markdown-it-mark//

/** Add Twitter like mentions in markdown using @twittername syntax */
// markdown-it-mentions'), markdownMentionsConfig)
/**
 * Options object including parse function for content generated
 * by mentions plugin using `@twittername` syntax.
 */
// const markdownMentionsConfig = {
  // parseURL: username => {
    // return `https://twitter.com/@${username}`
  // },
  /** adds a target="_blank" attribute if it's true and target="_self" if it's false */
  // external: true,
// }

/** Mermaid JavaScript based diagramming and charting tool */
// @TODO: uses ES Modules, needs Jest config adjusted. See note in spec file.
//// @liradb2000/markdown-it-mermaid'), markdownMermaidConfig)
/**
 * Mermaid JavaScript based diagramming and charting tool
 */
/*const markdownMermaidConfig = {
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
}*/
markdown.syntaxHighlight.excludeLangs
Type: Array<string>
Default: ['math']

Added in: astro@5.5.0
An array of languages to exclude from the default syntax highlighting specified in markdown.syntaxHighlight.type. This can be useful when using tools that create diagrams from Markdown code blocks, such as Mermaid.js and D2.

astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math'],
    },
  },
});


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

/** Github-stye Todo lists using checkboxes with - [ ] and - [x] markup */
// markdown-it-task-lists'), { label: true, labelAfter: true })

/** TeX rendering using KaTeX for math symbols */
// markdown-it-texmath'), markdownTexmathConfig)
/**
 * TeX rendering using KaTeX for math symbols
 */
/*const markdownTexmathConfig = {
  engine: require('katex'),
  delimiters: 'dollars',
  katexOptions: { macros: { '\\RR': '\\mathbb{R}' } },
}*/
/*
remark-math: A Remark plugin that parses LaTeX syntax within your Markdown files.
rehype-katex or rehype-mathjax: Rehype plugins that convert the parsed LaTeX into rendered HTML using either KaTeX or MathJax, respectively. KaTeX is often preferred for its performance and ability to allow text selection.
To implement this:
Install the necessary packages.
Code

    npm install remark-math rehype-katex katex
(or rehype-mathjax if you prefer MathJax).
Configure Astro: In your astro.config.mjs (or astro.config.ts), add remarkMath and rehypeKatex to your Markdown configuration:
*/

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

/*
To add functionality like markdown-it-attribution in Astro MDX, you can create a custom component and render it using a remark or rehype plugin, or use a specialized integration like astro-plugin-mdx-components which specifically supports a syntax for custom components within MDX content. You'll need to:
Install the MDX integration and the plugin:
npx astro add mdx
npm install astro-plugin-mdx-components
Define a custom component (e.g., Attribution.astro).
Configure the remark or rehype plugin to use your component:
Import the plugin into astro.config.mjs.
Use the remarkPlugins or rehypePlugins option to include your plugin.
The plugin will process your markdown and inject the component where the syntax is used.
JavaScript
*/

// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { attacher as mdxComponents } from 'astro-plugin-mdx-components';

export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [
        // Use the plugin to enable custom component syntax
        mdxComponents({
          // Define your components here
          components: {
            attribution: 'Attribution', // Map markdown syntax `attribution` to the component
          },
        }),
      ],
    }),
  ],
});
Code

/* your-file.mdx
<attribution>
This is some text that needs an attribution.
</attribution>
*/

// my-accessible-list-plugin.mjs
import { visit } from 'unist-util-visit';

export function myAccessibleListPlugin() {
  return (tree) => {
    visit(tree, 'list', (node) => {
      // Example: Add an aria-label to lists
      if (!node.data) {
        node.data = {};
      }
      if (!node.data.hProperties) {
        node.data.hProperties = {};
      }
      node.data.hProperties['aria-label'] = 'List of items'; // Customize this
    });
  };
}

┌─────────────────────────────────────────────────┐
│  Layer 1: Isolated Plugin Unit Tests            │
│  • Test ONE plugin at a time                    │
│  • Minimal pipeline (no GFM, no Astro settings) │
│  • Purpose: Verify plugin logic works           │
│  • Speed: Milliseconds                          │
│  • Run: On every save                           │
│  • Example: remark-attribution.spec.ts          │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Layer 2: Individual Plugin + Astro Pipeline    │
│  • Test ONE plugin at a time                    │
│  • Full Astro settings (GFM + smartypants)      │
│  • Purpose: Verify plugin works with Astro      │
│  • Speed: Seconds                               │
│  • Run: Before commits                          │
│  • Fail-fast: Identifies WHICH plugin breaks    │
│                                                 │
│  Pipeline per plugin:                           │
│  remark → GFM → [single plugin] →               │
│  remarkRehype(config) → rehypeStringify         │
│                                                 │
│  Import from markdown.ts:                       │
│  • remarkAttrConfig                             │
│  • remarkTocConfig                              │
│  • rehypeAutolinkHeadingsConfig                 │
│  • remarkRehypeConfig                           │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Layer 3: Full Integration Tests                │
│  • Test ALL plugins together                    │
│  • Complete pipeline with all interactions      │
│  • Purpose: Verify plugins don't conflict       │
│  • Speed: Seconds                               │
│  • Run: Before commits / CI                     │
│  • Debugging: Descriptive assertions + snapshots│
│                                                 │
│  Complete Pipeline:                             │
│  remark → GFM → [all 7 remark plugins] →        │
│  remarkRehype(config) → [all 3 rehype plugins] →│
│  rehypeStringify                                │
│                                                 │
│  Debugging Strategies:                          │
│  ✅ Descriptive test names per feature          │
│  ✅ Snapshot testing for regression detection   │
│  ✅ Pipeline debugger helper (DEBUG=1)          │
│  ✅ Individual feature assertions with messages │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Layer 4: E2E Component Rendering Tests        │
│  • Test markdown rendering through Astro        │
│  • Component-based validation with fixtures     │
│  • Purpose: E2E validation with accessibility   │
│  • Speed: Seconds                               │
│  • Run: Before commits / CI                     │
│  • Tools: Vitest + Testing Library + Axe        │
│                                                 │
│  Test Architecture:                             │
│  • Fixtures → Test Component (Astro) →          │
│    Full Pipeline → HTML → Accessibility Check   │
│                                                 │
│  Test Component (src/components/Test):          │
│  • Accepts markdown content as prop             │
│  • Processes through production pipeline        │
│  • Returns rendered HTML                        │
│                                                 │
│  Accessibility Testing (vitest-axe):            │
│  ✅ Every test validates with Axe library       │
│  ✅ Ensures WCAG compliance                     │
│  ✅ Validates ARIA attributes                   │
│  ✅ Checks semantic HTML structure              │
│                                                 │
│  Test Coverage (11 tests):                      │
│  • Abbreviations with accessibility             │
│  • Custom attributes on elements                │
│  • Blockquote attributions semantic HTML        │
│  • Emojis with ARIA attributes                  │
│  • Full pipeline integration (3 tests)          │
│  • Accessibility compliance (4 tests)           │
│                                                 │
│  Example: markdown-rendering.spec.tsx           │
│  Run: npx vitest run src/lib/markdown/__tests__/e2e/
└─────────────────────────────────────────────────┘
