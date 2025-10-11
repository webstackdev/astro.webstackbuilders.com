/**
 * Add accessible name to section in footnotes plugin
 */
const markdownFootnoteBlockOpen = () =>
  '<hr className="footnotes-sep">\n' +
  '<section class="footnotes" aria-label="footnotes">\n' +
  '<ol class="footnotes-list">\n'

/** Create block containers like a warning block - ::: warning my content ::: */
// markdown-it-container'), 'warning', markdownContainerWarning)
// const { markdownContainerWarning } = require('./markdownContainer')

/**
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

// astro.config.mjs
// remarkPlugins: [myAccessibleListPlugin], // Add your plugin here
// or rehypePlugins: [myAccessibleListPlugin], depending on your plugin type

Option 1: Enhanced Direct Plugin Testing

Additional Recommendations

1. Use existing pattern: Follow remark-attribution.spec.ts as the template

1. Enable experimental Container API (for future integration tests):

1. Consider visual regression testing for Tailwind classes:

* Use Playwright for screenshot comparison
* Test actual rendering in browser

1. Accessibility testing:

* Use vitest-axe (already installed)
* Test ARIA attributes from plugins

❓ Questions to Consider

* Do you want integration tests showing all plugins work together?
* Should we create visual regression tests for Tailwind styling?
* Do you want to test the build output (dist/) or just AST transformations?
* Should tests validate HTML spec compliance (using html-validate)?

Implement Option 1

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
│  Layer 4: E2E Tests (Build Output)              │
│  • Test actual built pages in browser           │
│  • Real-world rendering validation              │
│  • Purpose: Validate production behavior        │
│  • Speed: Minutes                               │
│  • Run: CI/CD only                              │
│  • Tools: Playwright                            │
└─────────────────────────────────────────────────┘

## Testing Strategy Benefits

### Why 4 Layers?

#### Layer 1: Fast Feedback Loop

* Catches basic plugin breakage immediately
* Runs on every file save (< 100ms per plugin)
* Example: Plugin upgrade breaks core functionality

#### Layer 2: Astro Compatibility Check

* Catches plugin incompatibility with Astro's settings
* Identifies WHICH plugin fails with GFM/smartypants
* Example: Plugin works alone but breaks with GFM enabled

#### Layer 3: Integration Safety

* Catches plugin interaction issues
* Verifies complete transformation pipeline
* Example: Two plugins modify same AST node incorrectly

#### Layer 4: Production Validation

* Catches browser-specific rendering issues
* Validates actual user experience
* Example: CSS classes applied but not styled correctly

### Debugging Flow Example

**Scenario**: After upgrading `remark-emoji` from v4 to v5:

1. **Layer 1** ❌ FAILS
   * Error: "remark-emoji should convert :heart: to ❤️"
   * **Diagnosis**: Plugin API changed, update test/usage
   * **Fix Time**: 2 minutes

2. **Layer 1** ✅ PASSES (after fix)
   * Plugin logic works in isolation

3. **Layer 2** ❌ FAILS
   * Error: "remark-emoji with Astro pipeline should work with GFM"
   * **Diagnosis**: Plugin v5 conflicts with GFM auto-linking
   * **Fix Time**: 10 minutes (check plugin docs, adjust order)

4. **Layer 2** ✅ PASSES (after fix)
   * Plugin works with Astro settings

5. **Layer 3** ✅ PASSES
   * All plugins work together

6. **Layer 4** ✅ PASSES
   * Production ready! 🎉

**Total Debug Time**: ~15 minutes (vs hours without layered testing)

## Layer 2: Individual Plugin + Astro Pipeline Test Setup

Test each plugin individually but with Astro's complete pipeline settings (GFM, smartypants, remarkRehype config).

```typescript
// __tests__/astro-pipeline/remark-emoji.spec.ts
import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import { remarkRehypeConfig } from '../../config/markdown.ts'

/**
 * Test a single plugin with Astro's full pipeline settings
 * This catches issues where a plugin works alone but fails with GFM/smartypants
 */
async function processWithAstroSettings(markdown: string): Promise<string> {
  const processor = remark()
    // Enable Astro's settings
    .use(remarkGfm)  // GFM enabled in Astro (gfm: true)
    // Note: smartypants is applied by Astro automatically, not as a plugin

    // Test ONE plugin
    .use(remarkEmoji)

    // Convert to HTML with Astro's remarkRehype config
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeStringify)

  const result = await processor.process(markdown)
  return String(result)
}

describe('remark-emoji with Astro Pipeline', () => {
  it('should convert emoji shortcodes', async () => {
    const markdown = 'I :heart: Astro :rocket:'
    const html = await processWithAstroSettings(markdown)

    expect(html).toContain('❤️')
    expect(html).toContain('🚀')
  })

  it('should work with GFM autolinks', async () => {
    const markdown = ':heart: visit https://example.com'
    const html = await processWithAstroSettings(markdown)

    // Verify emoji works
    expect(html).toContain('❤️')
    // Verify GFM autolink works
    expect(html).toContain('<a href="https://example.com">')
  })

  it('should work with GFM tables', async () => {
    const markdown = `
| Emoji | Code |
|-------|------|
| :heart: | heart |
    `.trim()

    const html = await processWithAstroSettings(markdown)

    expect(html).toContain('<table>')
    expect(html).toContain('❤️')
  })
})
```

### Layer 2 Test Structure

Create one test file per plugin in `__tests__/astro-pipeline/`:

```text
__tests__/
├── astro-pipeline/           ← Layer 2 tests
│   ├── remark-abbr.spec.ts
│   ├── remark-attr.spec.ts
│   ├── remark-attribution.spec.ts
│   ├── remark-breaks.spec.ts
│   ├── remark-emoji.spec.ts
│   ├── remark-linkify-regex.spec.ts
│   ├── remark-toc.spec.ts
│   ├── rehype-accessible-emojis.spec.ts
│   ├── rehype-autolink-headings.spec.ts
│   └── rehype-tailwind-classes.spec.ts
└── integration/              ← Layer 3 tests
    └── full-pipeline.spec.ts
```

## Layer 3: Full Integration Test Setup

Test all plugins together with complete Astro pipeline. Includes multiple debugging strategies.
  remarkTocConfig,
  rehypeAutolinkHeadingsConfig,
  remarkRehypeConfig,
  shikiConfigOptions,
} from '../../config/markdown.ts'

// Import plugins
import remarkAbbr from 'remark-abbr'
import remarkAttr from 'remark-attr'
import remarkAttribution from '../../config/remark-attribution/index.ts'
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import remarkLinkifyRegex from 'remark-linkify-regex'
import remarkToc from 'remark-toc'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { rehypeTailwindClasses } from '../rehype-tailwind-classes.ts'

/**
 * Process markdown through the EXACT same pipeline Astro uses
 */
async function processWithAstroPipeline(markdown: string): Promise<string> {
  const processor = remark()
    // Enable GFM (matches gfm: true)
    .use(remarkGfm)

    // Add all remark plugins in the same order as Astro
    .use(remarkAbbr)
    .use(remarkAttr, remarkAttrConfig)
    .use(remarkAttribution)
    .use(remarkBreaks)
    .use(remarkEmoji)
    .use(remarkLinkifyRegex, /^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
    .use(remarkToc, remarkTocConfig)

    // Convert to rehype with Astro's options
    .use(remarkRehype, remarkRehypeConfig)

    // Add all rehype plugins in the same order as Astro
    .use(rehypeAccessibleEmojis)
    .use(rehypeAutolinkHeadings, rehypeAutolinkHeadingsConfig)
    .use(rehypeTailwindClasses)

    // Optional: Add Shiki syntax highlighting if testing code blocks
    // .use(rehypeShiki, shikiConfigOptions)

    // Convert to HTML string
    .use(rehypeStringify)

  const result = await processor.process(markdown)
  return String(result)
}

describe('Full Markdown Pipeline Integration', () => {
  it('should process all plugins together like Astro does', async () => {
    const markdown = `
# Heading with TOC{.custom-class}

This is a paragraph with an :heart: emoji and a [link](https://example.com).

> A quote
> — Author Name

\`\`\`javascript
const code = 'block';
\`\`\`

| Table | Header |
|-------|--------|
| Cell  | Data   |

*[TOC]: Table of Contents
    `.trim()

    const html = await processWithAstroPipeline(markdown)

    // Verify multiple plugins worked together
    expect(html).toContain('<abbr title="Table of Contents">TOC</abbr>') // remarkAbbr
    expect(html).toContain('class="custom-class"') // remarkAttr
    expect(html).toContain('role="img"') // rehypeAccessibleEmojis
    expect(html).toContain('<figure class="c-blockquote">') // remarkAttribution
    expect(html).toContain('<table') // GFM tables
  })
})
```

## Layer 3 Debugging Strategies

### Strategy 1: Descriptive Assertions

Use clear test names and descriptive assertion messages to identify which plugin failed:

```typescript
// __tests__/integration/full-pipeline-with-debugging.spec.ts
describe('Full Pipeline - Feature Matrix', () => {
  it('should handle each plugin feature with descriptive assertions', async () => {
    const markdown = `
# Test Document

## Abbreviations Test
This tests MDAST functionality.

## Attributes Test
[Text with class]{.highlight}

## Attribution Test
> Quote text
> — Author Name

## Breaks Test
Line one
Line two

## Emoji Test
I :heart: testing

## Link Auto-conversion Test
Visit https://example.com

## Table Test (GFM)
| Col1 | Col2 |
|------|------|
| A    | B    |

*[MDAST]: Markdown Abstract Syntax Tree
    `.trim()

    const html = await processWithAstroPipeline(markdown)

    // Each assertion has a clear message showing which plugin should have worked
    expect(html, 'remarkAbbr should convert MDAST abbreviation')
      .toContain('<abbr title="Markdown Abstract Syntax Tree">MDAST</abbr>')

    expect(html, 'remarkAttr should add custom class to bracketed span')
      .toContain('class="highlight"')

    expect(html, 'remarkAttribution should wrap quote in figure element')
      .toContain('<figure class="c-blockquote">')

    expect(html, 'remarkBreaks should convert line breaks to <br> tags')
      .toContain('<br>')

    expect(html, 'remarkEmoji should convert :heart: shortcode to emoji')
      .toContain('❤️')

    expect(html, 'remarkLinkifyRegex should auto-convert URLs to links')
      .toContain('<a href="https://example.com">')

    expect(html, 'GFM should render markdown tables')
      .toContain('<table>')

    expect(html, 'rehypeAccessibleEmojis should add ARIA attributes to emojis')
      .toContain('role="img"')

    expect(html, 'rehypeAutolinkHeadings should add anchor links to headings')
      .toContain('anchor-link')

    expect(html, 'rehypeTailwindClasses should add CSS classes')
      .toContain('class=')

    // When a test fails, the error message immediately identifies the problematic plugin
  })
})
```

## Strategy 2: Snapshot Testing

Use snapshots to catch unexpected changes in the complete output:

```typescript
describe('Full Pipeline - Regression Detection', () => {
  it('should match snapshot for complex markdown', async () => {
    const markdown = `
# Main Heading

Content with :rocket: and https://example.com

> Important quote
> — Famous Person

*[API]: Application Programming Interface
    `.trim()

    const html = await processWithAstroPipeline(markdown)

    // Snapshot captures the COMPLETE output
    // Any change in ANY plugin will show the full diff
    expect(html).toMatchSnapshot()
  })
})
```

## Strategy 3: Pipeline Debugger Helper

Create a debug utility to visualize transformations at each stage:

```typescript
// __tests__/helpers/pipeline-debugger.ts
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import rehypeStringify from 'rehype-stringify'

export async function debugPipeline(markdown: string) {
  const stages: Array<{ stage: string; output: string }> = []

  // Stage 1: After GFM only
  const afterGfm = await remark()
    .use(remarkGfm)
    .use(remarkStringify)
    .process(markdown)
  stages.push({ stage: '1. After GFM', output: String(afterGfm) })

  // Stage 2: After all remark plugins
  const afterRemark = await remark()
    .use(remarkGfm)
    .use(remarkAbbr)
    .use(remarkAttr, remarkAttrConfig)
    .use(remarkAttribution)
    .use(remarkBreaks)
    .use(remarkEmoji)
    .use(remarkLinkifyRegex, /^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
    .use(remarkToc, remarkTocConfig)
    .use(remarkStringify)
    .process(markdown)
  stages.push({ stage: '2. After All Remark Plugins', output: String(afterRemark) })

  // Stage 3: After remarkRehype conversion
  const afterRehype = await remark()
    .use(remarkGfm)
    .use(remarkAbbr)
    .use(remarkAttr, remarkAttrConfig)
    .use(remarkAttribution)
    .use(remarkBreaks)
    .use(remarkEmoji)
    .use(remarkLinkifyRegex, /^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
    .use(remarkToc, remarkTocConfig)
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeStringify)
    .process(markdown)
  stages.push({ stage: '3. After remarkRehype Conversion', output: String(afterRehype) })

  // Stage 4: After all rehype plugins (final)
  const final = await processWithAstroPipeline(markdown)
  stages.push({ stage: '4. Final Output (All Plugins)', output: final })

  return stages
}

// Usage in tests
describe('Full Pipeline - Debug Mode', () => {
  it('should show transformation at each stage', async () => {
    const markdown = 'Test :heart: with https://example.com'
    const stages = await debugPipeline(markdown)

    // Enable with: DEBUG=1 npm test
    if (process.env.DEBUG) {
      console.log('\n=== PIPELINE TRANSFORMATION STAGES ===\n')
      stages.forEach(({ stage, output }) => {
        console.log(`${stage}:`)
        console.log(output)
        console.log('\n' + '─'.repeat(60) + '\n')
      })
    }

    const final = stages[stages.length - 1].output
    expect(final).toContain('❤️')
    expect(final).toContain('<a href="https://example.com">')
  })
})
```

### Running Layer 3 Tests

```bash
# Normal run
npm test integration

# With debug output
DEBUG=1 npm test integration

# Update snapshots after intentional changes
npm test integration -- -u
```

### What Smartypants Does

The `smartypants: true` option in Astro converts:

* `"quotes"` → "smart quotes"
* `'single'` → 'smart single quotes'
* `--` → en-dash (–)
* `---` → em-dash (—)
* `...` → ellipsis (…)
* `(c)` → ©
* `(r)` → ®
* `(tm)` → ™

**Note:** Smartypants is applied by Astro/Remark automatically when `smartypants: true` is set in the config. It's not a separate plugin to add to the pipeline, but the transformation happens during processing.

## Summary: 4-Layer Testing Strategy

### Test Organization

```text
src/lib/config/
├── __tests__/                    ← Layer 1: Isolated plugin tests
│   ├── remark-abbr.spec.ts
│   ├── remark-attr.spec.ts
│   └── ...
├── astro-pipeline/               ← Layer 2: Plugin + Astro settings
│   ├── remark-abbr.spec.ts
│   ├── remark-emoji.spec.ts
│   └── ...
├── integration/                  ← Layer 3: Full pipeline
│   ├── full-pipeline.spec.ts
│   ├── full-pipeline-with-debugging.spec.ts
│   └── regression.spec.ts
└── helpers/
    └── pipeline-debugger.ts      ← Debug utilities
```

### When Each Layer Runs

* **Layer 1**: Every file save (watch mode)
* **Layer 2**: Before commits (pre-commit hook)
* **Layer 3**: Before commits + CI/CD
* **Layer 4**: CI/CD only (E2E with Playwright)

### Recommended Test Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:unit": "vitest __tests__",
    "test:astro": "vitest astro-pipeline",
    "test:integration": "vitest integration",
    "test:debug": "DEBUG=1 vitest integration",
    "test:ci": "vitest run && playwright test"
  }
}
```

Move the syntaxHighlight config option to an export and use it

