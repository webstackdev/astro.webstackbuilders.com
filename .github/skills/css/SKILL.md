---
name: css
description: Use this skill when writing or reviewing CSS in this repository. Triggers include .css files, selector specificity, z-index usage, dark-mode theming, and Tailwind dark variant questions.
---

# CSS skill

Use this skill for stylesheet edits in this repository.

## Rules

- Prefer a single class selector for styling.
- Avoid ID selectors in CSS. Use classes or attributes instead.
- Avoid chaining state across unrelated roots.
- Avoid long selector chains. If more specificity is needed, add a single component class.
- Avoid `!important` except in vendor CSS and print rules.
- Do not use Tailwind `dark:` variant classes for dark-mode theming.
- Use the project's theme tokens and helper classes instead.

## Z-index rules

- Do not hard-code numeric `z-index` values.
- Use the z-index tokens defined in `src/styles/index.css`.
- If no existing token fits, ask the user before adding a new token.

## Related guidance

- Theme color tokens remain governed by the always-on `theme-colors.instructions.md` rules.

## References

- See `.claude/skills/css/references/examples.md` for concrete repo examples.