# Testing references

Use these existing repo files as the baseline examples before creating new testing patterns:

- `src/components/Test/container.astro`
- `src/components/Test/container.spec.ts`
- `src/components/Test/__tests__/webComponent.spec.ts`
- `test/e2e/helpers/waitTimeouts.ts`

When editing E2E tests, prefer shared BasePage helpers and existing timeout knobs instead of direct Playwright calls or numeric waits.
