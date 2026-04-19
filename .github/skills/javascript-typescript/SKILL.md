---
name: javascript-typescript
description: Use this skill when writing or reviewing JavaScript or TypeScript in this repository. Triggers include .js, .jsx, .ts, .tsx, semicolon style, JSDoc, and Playwright timeout knobs in test/e2e.
---

# JavaScript and TypeScript skill

Use this skill for JavaScript and TypeScript edits in this repository.

## Rules

- Use `const` and `let` instead of `var`.
- Prefer arrow functions for anonymous functions.
- Use JSDoc for public functions and components.
- Do not add semicolons at the end of statements.

## Playwright timeout policy

- For code under `test/e2e/**`, do not introduce new numeric timeouts.
- Use existing timeout knobs from `test/e2e/helpers/waitTimeouts.ts`.
- If none fit, stop and ask whether to add a new timeout knob, refactor to an event-based wait, or change the underlying behavior.

## Related guidance

- For broader test rules, also use the `testing` skill.
- For Astro View Transitions navigation behavior, also use the `view-transitions` skill.

## References

- See `.github/skills/javascript-typescript/references/examples.md` for concrete repo examples.