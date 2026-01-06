---
applyTo: "**"
---

# Theme color token policy

The source of truth for **all** colors in this repo is:
- `src/styles/theme-inline.css`

## Rules

- Only use colors that are defined as `--color-*` tokens in `src/styles/theme-inline.css`.
- Do not use Tailwind default palette classes (e.g., `bg-gray-100`, `text-blue-600`, `border-red-500`) unless the corresponding `--color-...` token exists in `src/styles/theme-inline.css`.
- When using Tailwind color utilities, the color name must match a defined token in `src/styles/theme-inline.css`. This includes (non-exhaustive):
  - `text-*`, `bg-*`, `border-*`, `ring-*`, `outline-*`, `decoration-*`
  - `fill-*`, `stroke-*`
  - gradient tokens: `from-*`, `via-*`, `to-*`
- When using CSS variables, only reference `var(--color-...)` tokens that are defined in `src/styles/theme-inline.css`.

## Permission required

- If a future change requires a new color token (a new `--color-*` or a new Tailwind color utility name that would require adding a token), **stop and ask for explicit permission before adding it**.
