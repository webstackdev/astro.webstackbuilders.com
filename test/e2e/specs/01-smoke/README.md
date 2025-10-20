# Smoke Tests

Critical smoke tests that verify the most essential functionality of the site.

## Test Files

### `homepage.spec.ts` (2 tests - @ready)

Dedicated homepage tests with app initialization checks:

- Homepage loads successfully
- App state initializes without errors (checks console for success/error messages)
- No console errors on load

### `critical-paths.spec.ts` (8 tests - 2 @ready, 6 @wip)

Core navigation and functionality:

- All main pages accessible
- Footer present on all pages
- Navigation works across pages
- Contact form visible
- Newsletter form visible
- 404 page displays correctly
- Theme picker accessible
- Cookie consent banner (blocked - needs localStorage helper)

### `dynamic-pages.spec.ts` (5 tests - 3 @ready, 2 @wip)

Tests for dynamically generated pages using Astro's `getStaticPaths()`:

- Article detail page loads
- Service detail page loads
- Case study detail page loads
- RSS feed accessible and valid XML
- Manifest.json accessible and valid JSON

## Dynamic Page Testing Strategy

The `dynamic-pages.spec.ts` file handles a common challenge: testing dynamically generated pages when content may change over time.

**Problem**: Hard-coding article slugs like `/articles/my-first-post` will break if that article is deleted or renamed.

**Solution**: Dynamically discover content at test runtime:

```typescript
// Visit the list page
await page.goto('/articles')

// Find the first article link (whatever it is)
const firstArticleLink = page.locator('a[href*="/articles/"]').first()
const articleUrl = await firstArticleLink.getAttribute('href')

// Navigate to that article
await page.goto(articleUrl!)
```

This approach:

- ✅ Works even when content changes
- ✅ Tests real content, not fixtures
- ✅ Verifies list → detail navigation flow
- ✅ Gracefully skips if no content exists

## Running Smoke Tests

**Production mode** (all browsers):

```bash
npm run test:e2e:smoke
```

**Debug mode** (chromium only, no HTML report):

```bash
npm run test:e2e:dev:smoke
```

**With visible browser**:

```bash
DEBUG=true npm run test:e2e:smoke -- --headed
```

## App State Initialization Testing

The homepage test verifies that the app bootstrap process completes successfully by listening for console messages:

**Success case**:

```text
✅ App state initialized
```

**Error case**:

```text
❌ Failed to initialize consent from cookies: <error>
❌ Failed to initialize state side effects: <error>
❌ App state initialized with errors
```

The test ensures no initialization errors occur during page load.
