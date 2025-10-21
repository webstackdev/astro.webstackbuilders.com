<!-- markdownlint-disable -->

## LLMs

- qwen3-coder-30b-a3b-instruct
- xAI: Grok 4 Fast
- Z.AI: GLM 4.6
- Google: Gemini 2.5 Flash Preview 09-2025

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
- Downloads, Cookie Consent, newsletter

### Phase 4: Generated Content

1. `sitemap.xml.ts`
2. `robots.txt.ts`
3. Search functionality

## Vercel Analytics

- Highlighter component
- Social Shares component
- Social Embeds: Track embed interactions
- Cookie Consent
- Download Form component

npm i @vercel/analytics
import Analytics from '@vercel/analytics/astro'
https://vercel.com/docs/analytics/quickstart#add-the-analytics-component-to-your-app

## Test Structure Overview

| Aspect        | Unit Tests              | Unit + Astro Defaults | E2E Tests |
| ---- | ---- | ---- | ---- |
| Purpose       | Upstream regression     | Plugin + Astro compatibility | Production rendering |
| Test Data     | Inline markdown         | Inline markdown strings | External fixture files |
| Pipeline      | Minimal (single plugin) | Astro defaults + plugin | Full production pipeline |
| Rendering     | String processing       | String processing    | React component rendering |
| Validation    | String matching         | String matching      | DOM queries + Axe a11y |
| Accessibility | ❌ Not tested            | ❌ Not tested         | ✅ Comprehensive (axe) |
| Dependencies  | Vitest only             | Vitest only          | Vitest + Testing Library + vitest-axe |

Unit tests catch upstream breaking changes, unit tests with Astro defaults verify compatibility, and E2E tests ensure the final output is accessible and semantically correct for users.

### ✅ Compatible Plugins:

Working plugins that pass all tests:

- remark-attribution (custom plugin - 17/17 tests passing)
- remark-breaks
- remark-emoji
- remark-linkify-regex
- remark-toc
- rehype-accessible-emojis
- rehype-autolink-headings
- rehype-tailwind-classes

### Rehype Tailwind Classes

Conditional elements (have checks):

- a (checks for .btn and .heading-anchor)
- code (checks if within pre)
- h2/h3/h4
- blockquote (attribution check)
- pre
- iframe
- various special cases

### Duplicate test code across units, units_with_default_astro, and e2e

- rehypeAccessibleEmojis.spec.tsx

Summary: What Should Change

Remove:

Layer 2: "should use custom footnote labels from Astro config" test (doesn't test emojis)

Recommendation:

"Text without emojis" should be tested in all three layers
GFM-specific tests (tables, strikethrough, task lists) are appropriate for Layer 2 only
Empty aria-label verification from E2E could be added to Layer 2

Add to Layer 2 (Astro):

Test emoji shortcodes (:heart:) in addition to Unicode
"Text without emojis" edge case
DOM-based validation with axe (optional, but valuable)
Empty aria-label verification

Add to Layer 4 (E2E):

Unicode emoji tests in addition to shortcodes
"Text without emojis" edge case
Expand emoji.md fixture to include more edge cases

Keep Layer 1 (Units) as-is:

It's focused and tests the isolated plugin correctly
Uses Unicode emojis which is appropriate
Has good edge case coverage

Fixture Enhancement Needed

The emoji.md fixture should include:

Unicode emojis (not just shortcodes)
Text without emojis
Emoji in headings
Emoji in various list types
More diverse emoji types

## Markdown Config Updates

Details/Summary elements - These HTML elements aren't being processed by remarkGfm (they need to be raw HTML)

/** Add ==highlighted== syntax */

1. add remark-mark plugin
2. Remove skip from integration test in

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
│  Unit Tests (Isolated)                          │
│  • NPM PACKAGES ONLY (upstream regression tests)│
│  • Test ONE plugin at a time                    │
│  • Minimal pipeline (no GFM, no Astro settings) │
│  • Purpose: Catch breaking changes from upgrades│
│  • Location: __tests__/units/                   │
│  • Speed: Milliseconds                          │
│  • Run: On every save                           │
│  • Example: remark-emoji.spec.ts                │
│                                                 │
│  Custom Plugins Tested in Plugin Directories:   │
│  • remark-abbreviations → plugins/remark-abbr...│
│  • remark-attributes → plugins/remark-attr...   │
│  • remark-attribution → plugins/remark-attr...  │
│  • rehype-tailwind → plugins/rehype-tailwind... │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Unit Tests with Astro Defaults                 │
│  • Test ONE plugin at a time                    │
│  • Full Astro settings (GFM + smartypants)      │
│  • Purpose: Verify plugin works with Astro      │
│  • Location: __tests__/units_with_default_astro/│
│  • Speed: Seconds                               │
│  • Run: Before commits                          │
│  • Fail-fast: Identifies WHICH plugin breaks    │
│                                                 │
│  Pipeline per plugin:                           │
│  remark → GFM → [single plugin] →               │
│  remarkRehype(config) → rehypeStringify         │
│                                                 │
│  Import from markdown.ts:                       │
│  • remarkAttributesConfig                       │
│  • remarkTocConfig                              │
│  • rehypeAutolinkHeadingsConfig                 │
│  • remarkRehypeConfig                           │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  E2E Component Rendering Tests                  │
│  • Test markdown rendering through Astro        │
│  • Component-based validation with fixtures     │
│  • Purpose: E2E validation with accessibility   │
│  • Location: __tests__/e2e/                     │
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
