# Markdown Pipeline Testing Strategy

The testing strategy for Unified (Remark/Rehype) plugins is broken into three distinct areas. There is substantial overlap between the unit, integration, and e2e tests. This is because each plugin can have global side effects on the Markdown as it is transformed to HTML and interfere with each other. By breaking out into these layers, it's easier to determine where interference is occurring - especially with the built-in GFM and SmartyPants plugins installed in Astro by default that have a large footprint.

## Steps to Add a New Unified (Remark, Rehype, or Remark-Rehype) Plugin

1. Add it to our configuration in src/lib/config/markdown.ts
2. Restart the dev server to pick up the new configuration
3. Add an example usage in src/content/articles/demo/index.mdx
4. I'll QA it in a browser visually
5. Add unit, integration, and e2e tests for it in src/lib/markdown
6. Run npm run test:unit and fix any errors
7. Add it to the src/content/test-fixtures/markdown/index.mdx test fixture
8. Add a Playwright E2E test for it in test/e2e/specs/04-components/markdown.spec.ts
9. Run the test and fix any errors
10. Run npm run lint and npm run check and fix any errors

## Astro Remark / Rehype Plugins Not Included

The following plugins are added by Astro to the Markdown to HTML processing pipeline, and are not accounted for in these tests due to complexity. They depend on full E2E tests using Playwright to verify correct behavior of project Unified plugins.

- `remark-collect-images`
- `rehype-images`
- `rehype-collect-headings`
- `rehype-shiki`

## Unit Tests (Isolated)

This directory contains isolated unit tests for NPM package plugins to catch breaking changes from upstream updates. These tests verify that third-party markdown plugins work as expected in isolation, especially in edge cases that may not have test coverage in the package.

Only NPM packages are tested here. Custom plugins have their own test suites in their respective directories in `src/lib/markdown/plugins`.

- Test one plugin at a time
- Minimal pipeline (no GFM, no Astro settings)
- Location: `__tests__/units/`
- Speed: Milliseconds

### Unit Test Purpose

- Test NPM package plugins independently before integration
- Detect breaking changes from package upgrades
- Verify expected behavior without interactions from other plugins
- Serve as regression tests for dependency updates

### When to Add Unit Tests

Add tests to this directory when:

- ✅ Adding a new NPM package plugin to the pipeline
- ✅ Upgrading an existing NPM package and want to verify behavior
- ✅ Documenting expected behavior of third-party plugins

### Do NOT add tests here for

- ❌ Custom plugins maintained in `plugins/` directory
- ❌ Integration between multiple plugins (use `integration/` tests)
- ❌ Full pipeline tests (use `e2e/` tests)

### Unit Test Approach

Tests use the `processIsolated()` helper from `../../helpers/test-utils.ts` which:

1. Processes markdown through a single plugin
2. Converts to HTML
3. Validates output without interference from other plugins

## Integration Tests with Astro Defaults

Astro has several Unified plugins built-in, including SmartyPants, GitHub-Flavored Markup (GFM), Shiki code highlighting, and a slugify system to add IDs to <h1> through <h6> elements for use in table of contents. Each test file focuses on one plugin at a time with complete Astro settings (GFM + smartypants).

The reason for doing this is that experience has shown that a lot of the friction in troubleshooting why a new plugin is not producing expected output involves interference from these built-in plugins.

This set of tests copies the configuration for each of those built-in Astro plugins and tests other plugins against that built-in stack.

- Test one plugin at a time
- Full Astro settings (GFM + smartypants)
- Location: `__tests__/integration/`
- Speed: Seconds
- Fail-fast: Identifies which plugin breaks

### Integration Test Purpose

- Test each plugin with the actual Astro configuration used in production
- Verify plugins work correctly with GFM and smartypants enabled
- Fail-fast debugging: When a test fails, you know exactly which plugin is broken
- Catch integration issues between a single plugin and Astro's default settings
- Serve as regression tests for plugin upgrades

### When to Add Integration Tests

Add tests to this directory when:

- ✅ Adding a new plugin to the markdown pipeline
- ✅ Upgrading a plugin and want to verify it works with Astro
- ✅ Debugging issues with a specific plugin
- ✅ Documenting expected behavior with Astro settings

### Pipeline Per Plugin (included in each test file)

`remark` → `GFM` → `[single plugin]` → `remarkRehype(config)` → `rehypeStringify`

## E2E Component Rendering Tests

- Test markdown rendered using Astro config
- Component-based validation with fixtures
- Purpose: E2E validation of plugins using the full Unified stack with accessibility tests
- Location: `__tests__/e2e/`
- Tools: Vitest + Testing Library + Axe

### E2E Test Architecture

`Fixtures` → `Test Component (Astro)` → `Full Pipeline → HTML` → `Accessibility Check`

- Test component (`src/components/Test`):
  - Accepts markdown content as prop
  - Processes through production pipeline
  - Returns rendered HTML

- Accessibility testing (`vitest-axe`):
  - Every test validates with Axe library
  - Ensures WCAG compliance
  - Validates ARIA attributes
  - Checks semantic HTML structure

### Imports from `markdown.ts`

- `remarkAttributesConfig`
- `rehypeAutolinkHeadingsConfig`
- `remarkRehypeConfig`
