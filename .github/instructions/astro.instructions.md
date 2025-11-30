---
applyTo: "docs/**/*.astro"
---

# Astro template standards

- Always use TypeScript for type safety.
- Always put script in a separate file and import it.

## Testing Astro Components

- When testing Astro components, use the Astro Container API instead of manual HTML fixtures.
- This ensures tests stay in sync with component changes automatically.
- Reference: Astro Container API Documentation at docs.astro.build/en/reference/container-reference/
- There is a model component and test demonstrating this pattern in the src/components/Test directory named webComponent.
