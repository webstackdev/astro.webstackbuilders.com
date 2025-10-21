# Layer 2: Astro Pipeline Tests (Individual Plugins)

## Overview

This directory contains tests for **individual plugins running through the full Astro pipeline**. Each test file focuses on one plugin at a time with complete Astro settings (GFM + smartypants).

## Purpose

- Test each plugin with the **actual Astro configuration** used in production
- Verify plugins work correctly with GFM and smartypants enabled
- **Fail-fast debugging**: When a test fails, you know exactly which plugin is broken
- Catch integration issues between a single plugin and Astro's default settings
- Serve as regression tests for plugin upgrades

## Test Approach

Each test file processes markdown through this pipeline:

```
remark
  → remarkGfm (GitHub Flavored Markdown)
  → [SINGLE PLUGIN BEING TESTED]
  → remarkRehype (with Astro config)
  → rehypeStringify
```

### Example Pipeline

Testing `remark-abbr`:

```typescript
remark()
  .use(remarkGfm)
  .use(remarkAbbr)              // ← Plugin under test
  .use(remarkRehype, remarkRehypeConfig)
  .use(rehypeStringify)
```

## Test Files

Current tests in this directory:

- `rehype-accessible-emojis-astro.spec.ts` - Emoji accessibility attributes
- `rehype-autolink-headings-astro.spec.ts` - Heading anchor links
- `rehype-tailwind-astro.spec.ts` - Tailwind class application
- `rehype-tailwind-simple-elements-astro.spec.ts` - Simple HTML element classes
- `remark-abbr-astro.spec.ts` - Abbreviation expansion
- `remark-attr-astro.spec.ts` - Custom attributes on elements
- `remark-attribution-astro.spec.ts` - Blockquote attributions
- `remark-breaks-astro.spec.ts` - Line break handling
- `remark-emoji-astro.spec.ts` - Emoji shortcode conversion
- `remark-linkify-regex-astro.spec.ts` - URL auto-linking
- `remark-toc-astro.spec.ts` - Table of contents generation

## Configuration Imports

Tests import production configurations from `src/lib/config/markdown.ts`:

- `remarkAttrConfig` - Attribute plugin settings
- `remarkTocConfig` - Table of contents settings
- `rehypeAutolinkHeadingsConfig` - Heading anchor settings
- `remarkRehypeConfig` - Astro's remark-to-rehype settings

## When to Add Tests

Add tests to this directory when:

- ✅ Adding a new plugin to the markdown pipeline
- ✅ Upgrading a plugin and want to verify it works with Astro
- ✅ Debugging issues with a specific plugin
- ✅ Documenting expected behavior with Astro settings

## Running Tests

```bash
# Run all Layer 2 tests
npm test -- src/lib/markdown/__tests__/layer_2_astro_pipeline

# Run specific plugin test
npm test -- src/lib/markdown/__tests__/layer_2_astro_pipeline/remark-abbr-astro.spec.ts

# Watch mode for development
npm test -- --watch src/lib/markdown/__tests__/layer_2_astro_pipeline
```

## Difference from Other Layers

| Layer | Focus | Pipeline |
|-------|-------|----------|
| **Layer 1** | NPM packages isolated | Single plugin only |
| **Layer 2** (This) | Individual plugin + Astro | Plugin with GFM + Astro config |
| **Layer 3** | All plugins together | Complete pipeline with interactions |
| **Layer 4** | E2E with accessibility | Full Astro component rendering + Axe |

## Speed

⚡ **Fast** - Seconds per test file

These tests are faster than full integration tests because they test one plugin at a time, making them ideal for rapid development feedback.
