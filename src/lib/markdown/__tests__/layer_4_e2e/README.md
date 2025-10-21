# Layer 4: E2E Markdown Rendering Tests

## Overview

Layer 4 provides end-to-end testing of markdown rendering through the complete Astro pipeline with comprehensive accessibility validation using the Axe library.

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

## Architecture

```bash
Markdown Fixtures
      ↓
Test Component (Astro)
      ↓
Full Markdown Pipeline
      ↓
Rendered HTML
      ↓
Testing Library + Axe Validation
```

## Test Component

Located at `src/components/Test/index.astro`, this component:

- Accepts markdown content as a prop
- Processes through the production-identical plugin pipeline
- Returns rendered HTML for testing

## Test Strategy

### Fixtures (`__fixtures__/`)

Five comprehensive fixtures testing different features:

1. **abbreviations.md** - Tests MDAST abbreviation plugin
2. **attributes.md** - Tests remark-attr custom classes
3. **attribution.md** - Tests blockquote attributions with figure/figcaption
4. **emoji.md** - Tests emoji shortcodes with accessibility
5. **full-pipeline.md** - Tests all features working together

### Test Coverage (11 tests)

#### Feature Tests (4)

- ✅ Abbreviations with proper HTML and accessibility
- ✅ Custom attributes on elements
- ✅ Blockquote attributions with semantic HTML
- ✅ Emojis with accessibility attributes

#### Integration Tests (3)

- ✅ All features together with proper semantics
- ✅ Valid semantic HTML structure
- ✅ Complex markdown with GFM features

#### Accessibility Tests (4)

- ✅ Abbreviations have title attributes
- ✅ Emojis have proper ARIA attributes
- ✅ Heading anchor links are accessible
- ✅ Blockquote attributions use semantic HTML

## Accessibility Validation

Every test includes accessibility validation using `vitest-axe`:

```typescript
const results = await axe(container)
expect(results).toHaveNoViolations()
```

This ensures:

- WCAG compliance
- Proper ARIA attributes
- Semantic HTML structure
- Screen reader compatibility

## Running Tests

```bash
# Run Layer 4 E2E tests only
npx vitest run src/lib/markdown/__tests__/e2e/

# Run all markdown tests (all 4 layers)
npx vitest run src/lib/markdown/__tests__/

# Run with watch mode
npx vitest watch src/lib/markdown/__tests__/e2e/
```

## Key Features

### No Snapshots

Tests use explicit assertions instead of snapshots for better maintainability and clearer test failures.

### Production Pipeline

Uses the exact same plugin configuration as production to ensure accurate E2E validation.

### Accessibility First

Every test validates accessibility with Axe, ensuring WCAG compliance is maintained.

### Preact Integration

Uses `@testing-library/preact` (not React) to match the project's Preact configuration.

## Test Statistics

- **Total Tests**: 146 across all 4 layers
  - Layer 1 (Isolated): 119 tests
  - Layer 2 (Astro Pipeline): 57 tests
  - Layer 3 (Full Integration): 10 tests
  - Layer 4 (E2E + Accessibility): 11 tests

## Dependencies

- `vitest` - Test runner
- `@testing-library/preact` - Component rendering
- `vitest-axe` - Accessibility testing
- `jsdom` - DOM environment

All dependencies were already present in the project.
