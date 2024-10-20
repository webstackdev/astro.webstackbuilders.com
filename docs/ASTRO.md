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



## Avoiding PurgeCSS Removing In-Use Classes

Don't dynamically build class names, generate whole class names:

```react
<div class="{{ error ? 'text-red-600' : 'text-green-600' }}"></div>
```



## Markdown styling

Tailwind Typography module using slate color theme:

[docs](https://tailwindcss.com/docs/typography-plugin)

```astro
<article className="prose lg:prose-xl prose-slate dark:prose-invert">
  {{ markdown }}
</article>
```

See link above for adding a custom color theme and modifying individual element styles