# Details About Using Astro

## TypeScript

```typescript
/** Enforce component taking no props or slotted content */
export type Props = Record<string, never>
```

## Editor / CMS

- TinaCMS

Has an opinionated approach to collections.

## Using SCSS preprocessor

Use `<style lang="scss">` in `.astro` files.

## Markdown styling

Tailwind Typography module using slate color theme:

[docs](https://tailwindcss.com/docs/typography-plugin)

```astro
<article className="prose lg:prose-xl prose-slate dark:prose-invert">
  {{ markdown }}
</article>
```

See link above for adding a custom color theme and modifying individual element styles
