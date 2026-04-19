# JavaScript and TypeScript references

Use these files as baseline examples for JavaScript and TypeScript patterns in this repo:

- `src/components/Toasts/NetworkStatus/client/index.ts`
- `test/e2e/helpers/waitTimeouts.ts`
- `test/e2e/helpers/pageObjectModels/BasePage.ts`
- `src/middleware.ts`

Key repo-specific constraints:

- Follow the semicolon-free style already used across the codebase.
- Reuse `wait.*` timeout knobs in E2E code.
- Prefer the existing shared helpers over ad-hoc browser interaction code.
