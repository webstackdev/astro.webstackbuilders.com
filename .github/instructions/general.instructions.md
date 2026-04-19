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
- For every `*.module.css` file, also create the matching `*.module.css.d.ts` file, import it as `styles`, and access classnames via dot syntax (e.g., `styles.someClass`) instead of bracket syntax.
- Prefer destructured imports over namespace imports when importing specific functions from modules (e.g., `import { resolve } from 'path'` instead of `import * as path from 'path'`).
- Do not access nanostore observables (e.g., `$consent`) directly from components; expose helper/action methods in `@components/scripts/store` and import those instead.
- Preact exists only for the Markdown E2E harness under `src/lib/markdown/__tests__/e2e`; all production UI components must use Lit web components instead of Preact.
- Z-index: never hard-code numeric z-index values (including Tailwind `z-*` utilities). Always use the CSS variables in `src/styles/index.css` (e.g., `z-index: var(--z-nav)` or `z-(--z-nav)`). If no existing token fits, ask the user what z-layer to use before adding/changing tokens.

## Component Reuse Policy

- Prefer existing `List`, `Icon`, and `Button` components whenever possible.
- `List`: use an existing list layout first. If no layout fits, ask the user before adding a new layout.
- `Icon`: use existing icons first. If a new icon is needed, ask the user first and describe the icon you plan to add.
- `Button`: use the shared `Button` component when the current API supports the use case.
- If a button would require adding `Button` props or forcing behavior that does not match the component, ask the user before using a raw HTML `<button>`/`<a>`, and explain why.

## Tailwind CSS variable shorthand

- Our linting rules (Tailwind ESLint) require using Tailwind's custom property shorthand form: `fill-(--my-brand-color)`.
- Do not use the bracket form: `fill-[var(--my-brand-color)]`.
- This applies broadly to Tailwind arbitrary-value utilities such as `fill-*`, `stroke-*`, `text-*`, `bg-*`, `border-*`, `ring-*`, `outline-*`, `w-*`, `h-*`, `z-*`, `transition-*`, etc.

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

## API Endpoints (Permission Required)

- **Do not create, recreate, or restore `src/pages/api/*` endpoints without explicit user permission.**
- Prefer Astro Actions (`/_actions/...`) for new backend behavior unless instructed otherwise.

## Mixed Concern Files

- Files that straddle server-side API and client-side concerns (like API client wrappers) require clarification
- **Ask before placing such files** - they may need special handling or alternative organization
- Example: gdpr.client.ts (API client wrapper) - unclear placement due to mixed server/client concerns

# Personality

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
