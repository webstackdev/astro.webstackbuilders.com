---
name: docs-astro
description: Use this skill when writing or editing Astro templates under docs/. Triggers include docs/**/*.astro, Astro frontmatter conventions, separate script files, and docs component testing guidance.
---

# Docs Astro skill

Use this skill for Astro files under `docs/`.

## Rules

- Always use TypeScript for type safety.
- Put script logic in a separate file and import it rather than embedding complex script code inline.

## Testing guidance

- When testing Astro components, use the Astro Container API instead of manual HTML fixtures.
- This keeps tests in sync with the actual component implementation.
- Use the working examples in `src/components/Test` as the reference pattern.

## Related guidance

- For broader Astro component testing rules, also use the `testing` skill.

## References

- See `.github/skills/docs-astro/references/examples.md` for concrete repo examples.