---
applyTo: "**"
---

# General coding standards

- Use camelCase for function and variable names.
- Always include clear, concise comments for complex functions.
- Add error handling for all network requests.
- Use template literals for string concatenation.
- Maintain consistent indentation (2 spaces).
- Limit lines to 120 characters for better readability.
- Use meaningful variable and function names.
- Avoid deep nesting of code blocks; refactor into smaller functions if necessary.
- Write modular code; separate concerns into different files or modules.
- Include unit tests for all new functions and components.
- Do not leave trailing spaces on lines.
- Do not use run-astro-dev, always use "npm run dev".
- Always create TypeScript files, not JavaScript files.
- Prefer destructured imports over namespace imports when importing specific functions from modules (e.g., `import { resolve } from 'path'` instead of `import * as path from 'path'`).
- Do not access nanostore observables (e.g., `$consent`) directly from components; expose helper/action methods in `@components/scripts/store` and import those instead.

# Code Organization and Directory Structure

## src/lib Directory Restrictions
- **The src/lib directory is for server-side build code ONLY**
- NO client-side code can go in src/lib (it gets bundled into server-side builds)
- Client-side utilities should go in src/components/scripts/ or appropriate component directories

## API Code Organization
- **API endpoints** go in `src/pages/api/`
- **Code files related to API endpoints** go in `src/pages/api/` and are prefixed with `_` (e.g., `_utils/`, `_contracts/`)
- **API utility files** go specifically in the `_utils/` folder
- **API contract/type files** go in `_contracts/` folder for centralized type definitions

## Mixed Concern Files
- Files that straddle server-side API and client-side concerns (like API client wrappers) require clarification
- **Ask before placing such files** - they may need special handling or alternative organization
- Example: gdpr.client.ts (API client wrapper) - unclear placement due to mixed server/client concerns

# Astro View Transitions Navigation

Components may have behavior dependent on Astro View Transitions navigation events. Choose the appropriate navigation method:

- **Fresh page load**: Use `page.goto(url)` for full browser navigation (no View Transitions, triggers full page lifecycle)
- **Client-side navigation**: Use `navigateToPage('/path')` for in-site navigation with View Transitions (triggers `astro:page-load` and other View Transition events)

Always use the `navigateToPage()` method for client-side navigation - never ad-hoc `click('a[href]')` calls. This maintains centralized control.

# Personality

# Testing Standards

## Astro Component Testing - Container API (MANDATORY)

- **NEVER use manual HTML strings in test files or fixtures.** They get out of sync with templates and are worse than no test at all.
- **ALWAYS use Astro's Container API** to create fixtures from actual .astro templates. See: https://docs.astro.build/en/reference/container-reference/
- **Test fixtures MUST import actual components**, not duplicate HTML. Example:
  ```astro
  ---
  import MyComponent from '@components/MyComponent/index.astro'
  const { testProp } = Astro.props
  ---
  <MyComponent prop={testProp} />
  ```
- **Hard-coded HTML fixtures are FORBIDDEN.** If you find yourself writing HTML in a fixture, STOP and use the actual component instead.
- Reference the working example in src/components/Test/container.astro and its test file.
- Use experimental_AstroContainer.create() to instantiate the container.
- Use container.renderToString(Component) to get rendered HTML from actual Astro components.
- For DOM unit testing with Container API: use `// @vitest-environment happy-dom` for better DOM compatibility than jsdom or node.
- Configure Vitest with getViteConfig() from 'astro/config' to support Astro Container API.
- Test files should follow a client.spec.ts naming pattern or similar.
- Fixture files should follow a componentName.fixture.astro naming pattern (e.g., newsletter.fixture.astro).
- Use `// @vitest-environment happy-dom` as the first line of test files that need DOM support with Container API. Never include Vitest directives inside JSDoc comments.
- happy-dom provides proper document, window, and localStorage globals without manual mocking.
- JavaScript loading warnings from happy-dom are silenced in vitest.setup.ts for clean test output.
- A working example test using the Container API is available at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/src/components/Test/container.spec.ts

## E2E Testing Standards

- **NEVER hard-code content slugs in e2e tests** (e.g., `/articles/typescript-best-practices`, `/services/web-development`). Content can be deleted or renamed. Always dynamically fetch the first available item from listing pages (articles, services, case-studies, etc.) and navigate to it. This prevents test breakage when content changes.
- **Playwright E2E Tests**: ALWAYS run with `DEBUG=1` environment variable (e.g., `DEBUG=1 npx playwright test`). This prevents the Playwright test runner from launching its own dev server. The user maintains a running dev server for development.
- **NEVER run the full e2e test suite** unless explicitly requested by the user. The full suite is very resource intensive and takes over 10 minutes to run. Only run specific e2e test files when verification is needed (e.g., `DEBUG=1 npx playwright test test/e2e/specific-file.spec.ts`).
- **NEVER start a dev server yourself**. The user runs their own dev server for development. When you need a dev server running, notify the user instead of starting one.

### Astro View Transitions Testing

- **Navigation method matters**: Choose between `page.goto()` and Astro's client-side navigation based on what you're testing:
  - Use `page.goto(url)` for testing **fresh page loads** (full browser navigation, no View Transitions)
  - Use `page.click('a[href="/path"]')` or BasePage's `navigateToPage()` for testing **View Transitions** (client-side navigation within the site)
- **Wait for page load properly**: Use BasePage's `waitForPageLoad()` method to wait for `astro:page-load` event instead of arbitrary timeouts
- **NEVER use `page.waitForTimeout()`** for waiting on View Transitions - it's unreliable and slows tests. Use event-based waits instead
- **transition:persist directive**: Must be applied directly to HTML elements (including custom elements), not on Astro component wrappers. Example:
  ```astro
  <!-- CORRECT: In component definition -->
  <theme-picker transition:name="theme-picker-island" transition:persist>

  <!-- WRONG: On component usage -->
  <ThemePicker transition:name="theme-picker-island" transition:persist />
  ```

# Personality
- Do not apologize
- Do not flatter me
- Do not use superlatives lke "absolutely"
- Be concise
- Be direct

# Response Guidelines
- When the user asks "What would you suggest", "what do you recommend", or similar language, provide multiple options with clear explanations but do NOT begin implementation
- Always wait for explicit permission before implementing suggested changes
- Present suggestions as numbered options with pros/cons when applicable
