# Layer 1: Isolated Unit Tests (NPM Packages)

## Overview

This directory contains **isolated unit tests for NPM package plugins** to catch breaking changes from upstream updates. These tests verify that third-party markdown plugins work as expected in isolation.

## Purpose

- Test NPM package plugins independently before integration
- Detect breaking changes from package upgrades
- Verify expected behavior without interactions from other plugins
- Serve as regression tests for dependency updates

## Scope

**Only NPM packages** are tested here:

- ✅ `remark-emoji` - Emoji shortcode conversion
- ✅ `remark-breaks` - Line break handling
- ✅ `remark-linkify-regex` - URL auto-linking
- ✅ `rehype-accessible-emojis` - Emoji accessibility attributes
- ✅ `rehype-autolink-headings` - Heading anchor links

## Custom Plugins

**Our custom plugins have their own test suites** in their respective directories:

- `remark-abbr` → `plugins/remark-abbr/__tests__/` (11 tests)
- `remark-attr` → `plugins/remark-attr/__tests__/` (46 tests)
- `remark-attribution` → `plugins/remark-attribution/__tests__/` (17 tests)
- `rehype-tailwind` → `plugins/rehype-tailwind/__tests__/` (29 tests)

## Test Approach

Tests use the `processIsolated()` helper from `../../helpers/test-utils.ts` which:

1. Processes markdown through a single plugin
2. Converts to HTML
3. Validates output without interference from other plugins

## When to Add Tests

Add tests to this directory when:

- ✅ Adding a new NPM package plugin to the pipeline
- ✅ Upgrading an existing NPM package and want to verify behavior
- ✅ Documenting expected behavior of third-party plugins

Do NOT add tests here for:

- ❌ Custom plugins maintained in `plugins/` directory
- ❌ Integration between multiple plugins (use `integration/` tests)
- ❌ Full pipeline tests (use `e2e/` tests)

## Running Tests

```bash
# Run all isolated unit tests
npm test -- src/lib/markdown/__tests__/isolated_unit_tests

# Run specific plugin test
npm test -- src/lib/markdown/__tests__/isolated_unit_tests/remark-emoji.spec.ts
```

## Test Coverage

Current coverage: **6 NPM packages** with isolated tests

See test files for specific test cases and expected behaviors.
