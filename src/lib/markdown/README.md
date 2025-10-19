<!-- markdownlint-disable -->

## LLMs

- qwen3-coder-30b-a3b-instruct
- xAI: Grok 4 Fast
- Z.AI: GLM 4.6
- Google: Gemini 2.5 Flash Preview 09-2025

Violation 3: Helper files not in server.ts or client.ts (Invariant #4)

Location: Mastodon

These files exist outside of server.ts or client.ts:

config.ts
detector.ts
store.ts

While they may be used by the Mastodon components, they're not organized into either server.ts or client.ts files as your invariant requires.


Notify me if any of these invariants are not true:

- Astro templates in src/layouts and src/pages should not include client script. This means no HTML script tags in the template.
- Astro templates in src/components should only import a client.ts file in the HTML script tag if they have client script, and no other file name.
- Script files named server.ts in src/components are for code used in the build process and are imported in the frontmatter of a template only.
- Components in src/components can import code for the build process that are imported in the frontmatter of a template from src/lib/helpers, in addition to using a script.ts file in their directory. No other local files in the project should be directly included. Importing packages that are installed in node_modules for the build process are okay.
- All other filenames in component folders, except for tests and fixtures, should only be included in files named either server.ts or client.ts
- All client script should be executed by the loader system in the Scripts component, not directly in other component files by adding it to DOM listeners or executed immediately.
- There should be no client script besides an import for client.ts file and the loader logic in component templates in the HTML template files.


## Webmention Component Next Steps:

Get API token from webmention.io
Add WEBMENTION_IO_TOKEN to .env
(Optional) Set up Bridgy for social media
Test with sample webmentions

## Download Form component

**API Integration**: The submit endpoint currently only logs to console. Integration with CRM/email service required for production use.

## GDPR Compliance Module

- Explicit consent checkboxes
- Double opt-in flow
- Right to erasure handling
- **Component needed**: `<GDPRConsent />` checkbox group
- Downloads, Cookie Consent

### Phase 4: Generated Content

1. `sitemap.xml.ts`
2. `robots.txt.ts`
3. Search functionality

## Implement Astro View Transitions

- Script re-execution

Bundled module scripts, which are the default scripts in Astro, are only ever executed once. After initial execution they will be ignored, even if the script exists on the new page after a transition.

Unlike bundled module scripts, inline scripts have the potential to be re-executed during a user's visit to a site if they exist on a page that is visited multiple times. Inline scripts might also re-execute when a visitor navigates to a page without the script, and then back to one with the script.

With view transitions, some scripts may no longer re-run after page navigation like they do with full-page browser refreshes. There are several events during client-side routing that you can listen for, and fire events when they occur. You can wrap an existing script in an event listener to ensure it runs at the proper time in the navigation cycle.

The following example wraps a script for a mobile hamburger menu in an event listener for astro:page-load which runs at the end of page navigation to make the menu responsive to being clicked after navigating to a new page:

```typescript
document.addEventListener("astro:page-load", () => {
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("expanded")
  })
})
```

- Need to add special handling to Navigation

```astro
<script>
  import { navigate } from "astro:transitions/client";

  // Navigate to the selected option automatically.
  document.querySelector("select").onchange = (event) => {
    let href = event.target.value;
    navigate(href);
  };
</script>
<select>
  <option value="/play">Play</option>
  <option value="/blog">Blog</option>
  <option value="/about">About</option>
  <option value="/contact">Contact</option>
</select>
```

- `client:load`: (`DOMContentLoaded`) load and hydrate a component's JavaScript immediately when the page loads.

This is useful for interactive components that need to be ready right away, such as a navigation menu, and it ensures the component is fully functional as soon as the HTML has loaded.

- `client:idle`: Loads JavaScript when the browser is idle, after the initial page load.

Uses the browser's requestIdleCallback() method to schedule the hydration of a component when the browser has a moment of idle time.

- `client:visible`: Loads JavaScript only when the component scrolls into the viewport.

Uses Intersection Observer API to load and execute when a component enters the user's viewport.

- `client:media`: Loads JavaScript when a CSS media query is met.

Functionally equivalent to the native DOM change event on a MediaQueryList object. Achieved in standard JavaScript by using window.matchMedia() to create a MediaQueryList object, and then attaching a change event listener to it.

- `client:only`: Renders and hydrates the component only on the client, skipping server rendering entirely (behaves similarly to client:load but with no server-rendered HTML content).

## Sentry manual error capture

Sentry.captureException(err)
Sentry.captureMessage("Something went wrong");
// optionally specify the severity level:
// "fatal" | "error" | "warning" | "log" | "debug" | "info" (default)
Sentry.captureMessage("Something went wrong", "warning")


## E2E Tests to Implement

* E2E Tests (test/e2e/highlighter.spec.ts):

  - Visual regression
  - Hover interactions
  - Click behavior (mock window.open)
  - Keyboard navigation
  - Mobile touch interactions
  - Accessibility compliance

* We need to add Lighthouse testing
* Axe accessibility testing
* Test Social Embeds with real embeds from social networks
* Verify the cookie consent preferences work correctly across different browsers

## Vercel Analytics

- Highlighter component
- Social Shares component
- Social Embeds: Track embed interactions
- Cookie Consent
- Download Form component

npm i @vercel/analytics
import Analytics from '@vercel/analytics/astro'
https://vercel.com/docs/analytics/quickstart#add-the-analytics-component-to-your-app

## Cookie Consent

- Advanced Features: Add cookie expiration management, preference export/import
- Compliance: Add GDPR compliance features like data deletion requests

## Markdown Config Updates

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

## Markdown Pipeline Testing Strategy

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
