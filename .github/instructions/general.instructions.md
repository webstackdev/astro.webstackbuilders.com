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

# Testing Standards

- NEVER use manual HTML strings in test files. They get out of sync with templates and are worse than no test at all.
- Always use Astro's Container API to create fixtures from actual .astro templates.
- Reference the working example in src/components/Test/container.astro and its test file.
- Use experimental_AstroContainer.create() to instantiate the container.
- Use container.renderToString(Component) to get rendered HTML from actual Astro components.
- For DOM unit testing with Container API: use `// @vitest-environment happy-dom` for better DOM compatibility than jsdom or node.
- Configure Vitest with getViteConfig() from 'astro/config' to support Astro Container API.
- Test files should follow a client.spec.ts naming pattern or similar.
- Fixture files should follow a componentName.fixture.ts naming pattern (e.g., newsletter.fixture.ts).
- Use `// @vitest-environment happy-dom` as the first line of test files that need DOM support with Container API. Never include Vitest directives inside JSDoc comments.
- happy-dom provides proper document, window, and localStorage globals without manual mocking.
- JavaScript loading warnings from happy-dom are silenced in vitest.setup.ts for clean test output.
- A working example test using the Container API is available at /home/kevin/Repos/Webstack Builders/Corporate Website/astro.webstackbuilders.com/src/components/Test/container.spec.ts
- **NEVER hard-code content slugs in e2e tests** (e.g., `/articles/typescript-best-practices`, `/services/web-development`). Content can be deleted or renamed. Always dynamically fetch the first available item from listing pages (articles, services, case-studies, etc.) and navigate to it. This prevents test breakage when content changes.
- **Playwright E2E Tests**: Set `DEBUG=1` environment variable to prevent the dev server from being launched by the Playwright test runner. This is useful when you want to run tests against an already running dev server.

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
