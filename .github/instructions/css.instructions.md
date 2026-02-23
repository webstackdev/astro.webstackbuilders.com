---
applyTo: "**/*.css"
---

# CSS rules (specificity budget)

- Prefer a single class selector for styling (`.componentPart`).
- Avoid ID selectors (`#something`) in CSS; use classes/attributes instead.
- Avoid chaining state across unrelated roots (e.g., `#header .child.is-open ...`). Put state on the owning component root.
- Avoid long selector chains; if you need more specificity, add a single component class rather than stacking selectors.
- Avoid `!important` except in vendor CSS and print rules.

- Do not use Tailwind `dark:` variant classes for dark-mode theming. This project uses a custom theme system and CSS variables; use the project's theme tokens and helper classes instead of Tailwind `dark:` utilities.

- Do not use Tailwind `dark:` variant classes for dark-mode theming. This project uses a custom theme system and CSS variables; use the project's theme tokens and helper classes instead of Tailwind `dark:` utilities.

# Z-index tokens

- Do not hard-code numeric `z-index` values.
- Use the z-index tokens defined in `src/styles/index.css` (e.g., `z-index: var(--z-modal)`).
- If no existing token fits, ask the user what z-layer to use before adding a new token.
