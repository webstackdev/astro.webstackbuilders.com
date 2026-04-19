---
name: testing
description: Use this skill when writing, reviewing, or running unit tests or E2E tests. Triggers include test, spec, fixture, Playwright, Vitest, Astro Container API, and wait timeout policy.
---

# Testing skill

Use this skill for all test-related work in this repository, especially `*.spec.ts`, Astro component tests, and Playwright E2E coverage.

## Process

1. Identify the test type before editing anything:
   - Astro component or unit test
   - Playwright E2E test
   - Test infrastructure or config
2. Apply the matching rules below.
3. Reuse the existing examples and helpers before introducing new patterns.
4. Run only targeted verification unless the user explicitly asks for broader coverage.

## Astro component and unit test rules

- Never use manual HTML strings in test files or fixtures.
- Use Astro's Container API with actual `.astro` templates.
- Test fixtures must import actual components, not duplicate rendered HTML.
- Prefer the naming pattern `filename.spec.ts` for tests and `componentName.fixture.astro` for fixtures.
- Use `experimental_AstroContainer.create()` to instantiate the container.
- Use `container.renderToString(Component)` to render actual Astro components.
- Configure Vitest with `getViteConfig()` from `astro/config` when Container API support is required.

## E2E test rules

- Never hard-code content slugs in E2E tests. Fetch dynamically from listing pages.
- Always run Playwright with `CI=1` and `FORCE_COLOR=1`.
- Never run the full E2E suite unless the user explicitly asks for it.
- Never start the dev server yourself. The user maintains the running dev server.
- Never use ad-hoc numeric timeouts in E2E specs or page objects.
- Use `wait.*` from `test/e2e/helpers/waitTimeouts.ts`.
- If no existing `wait.*` knob fits, ask before adding a bespoke timeout.
- Avoid `waitForLoadState('networkidle')` for gating. Prefer deterministic readiness signals.
- If a network-idle-like wait is truly needed, use `BasePage.waitForNetworkIdleBestEffort()`.

## View Transitions note

- For Astro View Transitions behavior, `transition:persist`, or navigation semantics, also use the `view-transitions` skill.

## Vite optimized deps guidance

- If Playwright becomes flaky due to optimized deps issues, prefer deterministic fixes over workarounds.
- Add the problematic package or entrypoint to `vite.optimizeDeps.include` in `astro.config.ts`.
- Enable `vite.optimizeDeps.force` for Playwright runs with `PLAYWRIGHT=true` when needed.

## References

- See `.github/skills/testing/references/examples.md` for concrete repo examples.
