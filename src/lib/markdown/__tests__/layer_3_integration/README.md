# Layer 3: Integration Tests (Full Pipeline)

## Overview

This directory contains tests for the **complete markdown pipeline with all plugins working together**. These tests catch interaction conflicts between plugins.

## Purpose

- Test the **entire plugin chain** as used in production
- Verify plugins don't conflict with each other
- Catch cascade effects where one plugin's output breaks another
- Document expected behavior of complex markdown combinations
- Regression test for the complete processing pipeline

## Test Approach

Tests process markdown through this complete pipeline:

```text
remark
  → remarkBreaks
  → remarkLinkifyRegex
  → remarkEmoji
  → remarkGfm
  → remarkAbbr
  → remarkAttr
  → remarkAttribution
  → remarkToc
  → remarkRehype
  → rehypeAutolinkHeadings
  → rehypeAccessibleEmojis
  → rehypeTailwind
  → rehypeStringify
```

All production configurations are applied (GFM, smartypants, plugin options, etc.).

## Test Files

- `full-pipeline.spec.ts` - Complete pipeline integration tests

## When to Add Tests

Add tests to this directory when:

- ✅ Multiple plugins interact with the same markdown feature
- ✅ You suspect plugin ordering might cause issues
- ✅ Complex markdown combinations need regression protection
- ✅ Debugging cascading failures across multiple plugins
- ✅ Documenting expected behavior for complex scenarios

## Running Tests

```bash
# Run all Layer 3 tests
npm test -- src/lib/markdown/__tests__/layer_3_integration

# Run specific test file
npm test -- src/lib/markdown/__tests__/layer_3_integration/full-pipeline.spec.ts

# Watch mode for development
npm test -- --watch src/lib/markdown/__tests__/layer_3_integration
```

## Integration vs E2E Tests

Both layers test the complete pipeline, but with different approaches:

| Aspect | **Layer 3: Integration** | **Layer 4: E2E** |
|--------|--------------------------|------------------|
| **Focus** | Plugin interactions via inline markdown | Full production rendering with external fixtures |
| **Test Input** | Inline markdown strings in test files | External `.md` fixture files |
| **Test Method** | Direct string matching on HTML output | React component rendering + Testing Library queries |
| **Validation** | String contains/equals assertions | Accessibility checks via vitest-axe |
| **Speed** | ⚡ Fast (seconds) | 🐢 Slower (renders full Astro components) |
| **Coverage** | Pipeline transformation logic | End-user experience + accessibility |
| **Debugging** | Easy to pinpoint exact transformation issue | Shows real-world rendering problems |
| **Best For** | Catching plugin conflicts and ordering issues | Validating final output quality and a11y |

## Debugging Strategy

When an integration test fails:

1. **Check plugin order** - Does one plugin's output break another?
2. **Run Layer 2 tests** - Do individual plugins pass in isolation?
3. **Inspect HTML output** - What unexpected transformation occurred?
4. **Check custom plugin tests** - Do plugin-specific tests still pass?
5. **Review git diff** - Did recent plugin config changes cause regression?

## Speed

⚡⚡ **Very Fast** - Seconds total

Integration tests use string processing only, no component rendering or browser simulation.

## Difference from Other Layers

| Layer | Focus | Pipeline |
|-------|-------|----------|
| **Layer 1** | NPM packages isolated | Single plugin only |
| **Layer 2** | Individual plugin + Astro | Plugin with GFM + Astro config |
| **Layer 3** (This) | All plugins together | Complete pipeline with interactions |
| **Layer 4** | E2E with accessibility | Full Astro component rendering + Axe |
