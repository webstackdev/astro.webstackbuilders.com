---
name: view-transitions
description: Use this skill when working on Astro View Transitions behavior, transition:persist, client-side navigation, or related Playwright coverage. Triggers include navigateToPage, waitForPageLoad, astro:page-load, page.goto, BasePage helpers, and persisted UI across navigation.
---

# View Transitions skill

Use this skill when changing Astro View Transitions behavior, implementing persisted UI, or writing tests that depend on client-side navigation.

## Process

1. Decide whether the behavior under test or implementation is a full page load or Astro client-side navigation.
2. Use the matching navigation primitive.
3. Reuse the shared BasePage helpers instead of ad-hoc Playwright interactions.
4. If persistence is involved, verify that `transition:persist` is applied in the component definition, not only at the call site.

## Navigation rules

- Use `page.goto(url)` for full browser navigations without View Transitions.
- Use `navigateToPage('/path')` for in-site client-side navigation with View Transitions.
- Never use ad-hoc `click('a[href]')` calls for client-side navigation flows.
- When a Playwright-native action is still required, expose it through shared `BasePage` helpers and reuse that helper from tests.

## Synchronization rules

- Use `BasePage.waitForPageLoad()` to wait for the `astro:page-load` event.
- Never use `page.waitForTimeout()` to gate View Transitions.
- Prefer deterministic readiness signals over generic waiting.

## Persistence rules

- Apply `transition:persist` directly to HTML elements, including custom elements, in the component definition.
- Do not place `transition:persist` only on an Astro component usage wrapper.
- When testing persistence, verify DOM identity and persisted state across navigation instead of only checking visual presence.

## References

- See `.github/skills/view-transitions/references/examples.md` for concrete repo examples.