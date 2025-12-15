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

remark
  → remarkGfm (GitHub Flavored Markdown)
  → [SINGLE PLUGIN BEING TESTED]
  → remarkRehype (with Astro config)
  → rehypeStringify

### Example Pipeline

Testing `remark-abbr`:

```typescript
remark()
  .use(remarkGfm)
  .use(remarkAbbr)              // ← Plugin under test
  .use(remarkRehype, remarkRehypeConfig)
  .use(rehypeStringify)
```

## When to Add Tests

Add tests to this directory when:

- ✅ Adding a new plugin to the markdown pipeline
- ✅ Upgrading a plugin and want to verify it works with Astro
- ✅ Debugging issues with a specific plugin
- ✅ Documenting expected behavior with Astro settings
