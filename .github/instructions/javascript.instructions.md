---
applyTo: "**/*.{js,jsx,ts,tsx}"
---

# JavaScript and TypeScript standards

- Use `const` and `let` instead of `var`.
- Prefer arrow functions for anonymous functions.
- Use JSDoc for all public functions and components.
- Do not add semicolons at the end of statements (semicolon-free style).

# Playwright E2E timeout policy (test/e2e/**)

- For Playwright E2E code under `test/e2e/**` (spec files and page object models), **do not** introduce new numeric timeouts (e.g. `{ timeout: 5000 }`, `waitForTimeout(600)`, `test.setTimeout(…)`).
- Always choose an existing timeout knob from `test/e2e/helpers/waitTimeouts.ts` (use `import { wait } ...` and `wait.*`).
- If none of the existing knobs fit the use case, **stop and ask** what to do (e.g. whether to add a new `wait.bespoke*` knob, refactor to an event-based wait, or change the underlying behavior).