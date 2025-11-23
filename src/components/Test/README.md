# Test Component Patterns

- **webComponent**: LitElement example that we hydrate in unit tests using the `withLitRuntime()` helper. This path covers runtime behavior such as property updates and DOM mutations that only exist after hydration.
- **container**: Plain Astro template rendered through the Astro Container API. Use this when you only need to assert static markup (selectors, class names, ids) without hydrating a client component.

Use the Lit approach when you need to prove client-side behavior, and the container approach when you only need to verify the rendered HTML structure.
