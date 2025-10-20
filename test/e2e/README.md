# E2E Testing with Playwright

This directory contains end-to-end tests for the Webstack Builders website using Playwright.

## Directory Structure

```bash
test/e2e/
├── README.md                          # This file
├── fixtures/
│   ├── test-data.ts                   # Shared test data (emails, form values, etc.)
│   ├── page-objects/                  # Page Object Models
│   │   ├── BasePage.ts                # Base page with common methods
│   │   └── components/                # Reusable component fixtures
│   └── helpers/                       # Helper functions
├── specs/
│   ├── 01-smoke/                      # Critical path smoke tests
│   ├── 02-pages/                      # Page-specific tests
│   ├── 03-forms/                      # Form functionality tests
│   ├── 04-components/                 # Interactive component tests
│   ├── 05-metadata/                   # SEO & metadata tests
│   ├── 06-accessibility/              # WCAG compliance tests
│   ├── 07-performance/                # Performance tests
│   ├── 08-api/                        # API endpoint tests
│   ├── 09-pwa/                        # Progressive Web App tests
│   └── 10-visual/                     # Visual regression tests
└── TEST_STATUS.md                     # Test status tracker (created as we go)
```

## Test Tags

We use tags to organize and filter tests:

- **`@ready`** - Test passes, ready for CI
- **`@wip`** - Work in progress, fixing SUT (System Under Test) issue
- **`@blocked`** - Blocked by external dependency
- **`@flaky`** - Intermittent failures, needs investigation
- **`@slow`** - Runs slowly, only in full test suite
- **`@smoke`** - Critical path smoke test

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Only Ready Tests (for CI)

```bash
npm run test:e2e:ready
```

### Smoke Tests Only

```bash
npm run test:e2e:smoke
```

### Work in Progress Tests

```bash
npm run test:e2e:wip
```

### All Tests Except Blocked

```bash
npm run test:e2e:all
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### List All Tests

```bash
npm run test:e2e:list
```

### View Test Report

```bash
npm run test:e2e:report
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/path')
  })

  test('@ready feature works correctly', async ({ page }) => {
    // Test passes, ready for CI
    await expect(page.locator('h1')).toBeVisible()
  })

  test.skip('@wip feature with known issue', async ({ page }) => {
    // Issue #123: Description of the problem
    // Expected: What should happen
    // Actual: What actually happens
    await expect(page.locator('.element')).toBeVisible()
  })

  test.skip('@blocked feature needs external service', async ({ page }) => {
    // Blocked by: API endpoint not deployed yet
    await expect(page.locator('.element')).toBeVisible()
  })
})
```

### Using Page Objects

```typescript
import { HomePage } from '../fixtures/page-objects/HomePage'

test('homepage loads', async ({ page }) => {
  const homePage = new HomePage(page)
  await homePage.goto('/')
  await homePage.verifyTitle(/Webstack Builders/)
})
```

### Using Test Data

```typescript
import { TEST_EMAILS, TEST_CONTACT_DATA } from '../fixtures/test-data'

test('contact form submission', async ({ page }) => {
  await page.fill('#email', TEST_EMAILS.valid)
  await page.fill('#name', TEST_CONTACT_DATA.valid.name)
  // ...
})
```

## Test Workflow

### Phase 1: Scaffolding

1. Create test files with `.skip()` for all scenarios
2. Add descriptive test names
3. Document known issues in comments
4. Tag appropriately (`@wip`, `@blocked`, etc.)

### Phase 2: Progressive Enablement

1. Pick a test category to work on
2. Run the tests: `npm run test:e2e -- specs/XX-category`
3. For each failure:
   - **Test bug?** Fix immediately, remove `.skip()`
   - **SUT bug?** File issue, keep `@wip` tag
   - **Fixed SUT?** Change `@wip` to `@ready`
4. Update TEST_STATUS.md
5. Commit and push

### Phase 3: Maintenance

- Run `@ready` tests in CI
- Investigate `@flaky` tests
- Work through `@wip` and `@blocked` tests

## CI/CD Integration

In CI environments (when `process.env.CI` is set):

- Only tests tagged with `@ready` are executed
- Tests retry up to 2 times on failure
- Uses GitHub Actions reporter
- Runs with 1 worker (sequential)

## Best Practices

1. **Always use tags** to categorize test status
2. **Document skip reasons** with comments and issue numbers
3. **Use Page Object Models** for better maintainability
4. **Keep test data centralized** in `fixtures/test-data.ts`
5. **Write descriptive test names** that explain what is being tested
6. **Update TEST_STATUS.md** when test status changes
7. **Fix test bugs immediately** - bad tests are worse than no tests
8. **File issues for SUT bugs** before tagging as `@wip`

## Debugging Tips

### View Browser During Test

```bash
npm run test:e2e:headed
```

### Step Through Test

```bash
npm run test:e2e:debug
```

### Take Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png', fullPage: true })
```

### Console Logs

```typescript
page.on('console', msg => console.log(msg.text()))
```

### Trace Viewer

Traces are automatically captured on first retry. View them:

```bash
npx playwright show-trace path/to/trace.zip
```

## Common Selectors

- `#newsletter-form` - Newsletter form
- `#newsletter-email` - Newsletter email input
- `#newsletter-gdpr-consent` - Newsletter GDPR checkbox
- `#contactForm` - Contact form
- `#gdpr-consent` - GDPR consent checkbox
- `#cookie-consent-banner` - Cookie consent banner
- `#theme-picker` - Theme picker component

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Generator](https://playwright.dev/docs/codegen)
