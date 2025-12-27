---
applyTo: "**/*.spec.ts"
---

# Testing Standards

## Astro Container API (Unit Tests)

- **NEVER use manual HTML strings** - use Astro's Container API with actual .astro templates
- **Test fixtures MUST import actual components**, not duplicate HTML
- Naming: `filename.spec.ts` for tests, `componentName.fixture.astro` for fixtures
- Working example: `src/components/Test/__tests__/webComponent.spec.ts`

## E2E Testing

- **NEVER hard-code content slugs** - fetch dynamically from listing pages
- **Always run with `CI=1` and `FORCE_COLOR=1`** - e.g., `CI=1 FORCE_COLOR=1 npx playwright test test/e2e/file.spec.ts`
- **NEVER run full e2e suite** unless requested - it takes 10+ minutes
- **NEVER start dev server** - user maintains running server
- **Use `BasePage.waitForPageLoad()`** to wait for `astro:page-load` event
- **NEVER use `waitForTimeout()`** - use event-based waits
- **NEVER use ad-hoc numeric timeouts** in E2E specs or page objects - use `wait.*` from `test/e2e/helpers/waitTimeouts.ts`.
- If no existing `wait.*` knob fits, **ask what to do** before adding a new `wait.bespoke*` knob.
- **transition:persist**: Apply to HTML elements in component definition, not on component usage

## View Transitions Testing

- `page.goto(url)` = Full page reload (no View Transitions)
- `page.navigateToPage('/path')` = Astro View Transitions (client-side navigation)
- Always use `navigateToPage()` for consistency - never ad-hoc `click('a[href]')`
