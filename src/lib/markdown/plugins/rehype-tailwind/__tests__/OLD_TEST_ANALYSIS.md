# Old Test Analysis for Simple HTML Elements

## Summary

This document analyzes which test cases from `__OLD_tests__` apply to the simple HTML elements extracted to `html.ts`.

## Elements in html.ts

The following 15 elements were extracted:

1. `p` - paragraphs
2. `img` - images
3. `video` - videos
4. `figure` - figure containers
5. `figcaption` - figure captions
6. `hr` - horizontal rules
7. `ul` - unordered lists
8. `ol` - ordered lists
9. `li` - list items
10. `mark` - highlighted text
11. `table` - tables
12. `th` - table headers
13. `td` - table cells
14. `summary` - disclosure summary
15. `details` - disclosure details

## Relevant Old Test Files

### 1. `markdown.spec.js` - Basic HTML Elements

**Tests for elements in html.ts:**

- ✅ **hr** - Horizontal rules (lines 74-91)
  - Tests three dashes `---` generates `<hr>`
  - Tests three asterisks `***` generates `<hr>`
  - Accessibility check with axe
  - **Coverage gap**: Only tests generation, not Tailwind classes

- ✅ **table, th, td** - Tables (lines 125-145)
  - Tests GFM table markup generates HTML tables
  - Tests table headers (th) via role="columnheader"
  - Tests table cells (td) via role="cell"
  - Accessibility check with axe
  - **Coverage gap**: Only tests structure, not Tailwind classes

**Tests for elements NOT in html.ts (conditional):**
- blockquote (lines 60-72) - Has attribution logic, not in html.ts
- code (lines 93-102) - Conditional (checks if within pre)
- pre (lines 104-122) - Has Shiki/syntax highlighting, not in html.ts

### 2. `accessibleLists.spec.js` - List Elements

**Tests for elements in html.ts:**

- ✅ **ul, ol, li** - Lists (entire file, ~70 lines)
  - Tests asterisk/dash generates `<ul>`
  - Tests numbers generate `<ol>`
  - Tests list items are created
  - Tests role="list" attribute added
  - Accessibility checks with axe
  - **Coverage gap**: Only tests structure and role attribute, not Tailwind classes

### 3. `imageCaption.spec.js` - Image and Figure Elements

**Tests for elements in html.ts:**

- ✅ **img** - Images (lines 11-27)
  - Tests bracket syntax generates `<img>`
  - Tests src and alt attributes
  - Tests reference-style images
  - Accessibility check with axe
  - **Coverage gap**: Only tests generation, not Tailwind classes

- ✅ **figure, figcaption** - Image captions (lines 29-43)
  - Tests caption syntax adds `<figure>` and `<figcaption>`
  - Tests figcaption text content
  - Tests accessible name
  - **Coverage gap**: Only tests structure, not Tailwind classes

### 4. Other Test Files Examined

- `video.spec.js` - Tests iframe embeds (YouTube, Vimeo), not plain `<video>` tags
- `highlighting.spec.js` - Tests `<mark>` highlighting, but for search feature, not markdown
- No old tests found for: `p`, `mark`, `summary`, `details`

## Test Coverage Gaps

### What Old Tests Check (Structure/Behavior)

1. ✅ Element generation (markdown → HTML)
2. ✅ Proper HTML structure
3. ✅ Attributes (src, alt, role)
4. ✅ Accessibility (axe violations)

### What Old Tests DON'T Check (Styling)

1. ❌ Tailwind CSS classes applied to elements
2. ❌ Class concatenation with existing classes
3. ❌ Configuration structure and integrity

### What New Tests Check (Configuration)

1. ✅ Configuration structure and types
2. ✅ Helper function behavior
3. ✅ Tailwind class application
4. ✅ Individual element configurations
5. ✅ Class concatenation logic

## Recommendations

### 1. Keep Both Test Approaches

- **Old tests** (integration): Test markdown→HTML transformation and accessibility
- **New tests** (unit): Test Tailwind class application and configuration

### 2. Missing Coverage in New Tests

Consider adding to `html.spec.ts`:

- **Accessibility tests**: Use axe to verify styled elements still meet WCAG standards
- **Integration tests**: Test actual markdown rendering with Tailwind classes
- **Attribute preservation**: Verify existing attributes (role, alt, src) aren't removed

### 3. Elements Without Old Tests

These elements have NO old test coverage:

- `p` - paragraphs (most common element!)
- `mark` - highlighting
- `summary`/`details` - disclosure widgets
- `video` (plain HTML, not iframes)

**Action**: Consider whether these need integration tests or if unit tests are sufficient.

### 4. Test Files to Keep vs Delete

**Keep (still relevant):**

- ✅ `markdown.spec.js` - Tests basic markdown transformation
- ✅ `accessibleLists.spec.js` - Tests list structure and accessibility
- ✅ `imageCaption.spec.js` - Tests figure/figcaption structure

**Review for migration:**

- ⚠️ Consider migrating specific test cases if they add value

**Delete (not relevant to html.ts):**

- ❌ Files testing conditional elements (anchors, headings, blockquotes, etc.)
- ❌ Files testing features not in rehype-tailwind

## Next Steps

1. ✅ **Completed**: Extract simple elements to html.ts
2. ✅ **Completed**: Create comprehensive unit tests (27 tests)
3. **Current**: Analyze old tests for applicable cases
4. **Next**: Update main index.ts to use html.ts module
5. **Future**: Consider adding accessibility tests to new test suite
6. **Future**: Archive or delete obsolete old test files
