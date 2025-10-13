---
applyTo: "docs/**/*.astro"
---

# Astro template standards

- Always use TypeScript for type safety.
- Always put script in a separate file and import it.

## Testing Astro Components

- When testing Astro components, use the Astro Container API instead of manual HTML fixtures.
- This ensures tests stay in sync with component changes automatically.
- Reference: [Astro Container API Documentation](https://docs.astro.build/en/reference/container-reference/)
- Note: The Container API may not work reliably in jsdom/vitest environments. For unit tests focused on JavaScript behavior (not component rendering), consider generating minimal test HTML instead.
