# CSS references

Use these files as baseline examples for CSS patterns in this repo:

- `src/components/Toasts/NetworkStatus/index.module.css`
- `src/styles/index.css`
- `src/styles/vendor/mermaid.css`
- `src/styles/theme-inline.css`

Key repo-specific constraints:

- Prefer low-specificity component classes.
- Use theme tokens instead of ad-hoc colors.
- Use z-index tokens from `src/styles/index.css` instead of numeric literals.
