# remark-attribution

> A plugin for [remark](https://github.com/remarkjs/remark) (unified ecosystem) that
> generates accessible markup for block quotes with attribution lines. The
> generated output follows the suggestions in the living standard of the
> [WHATWG](https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element).

**Requires `remark` v13.+ and `remark-rehype` for HTML output**

The plugin allows to provide an attribution for a quotation:

```md
> That's one small step for [a] man, one giant leap for mankind.
> — Neil Armstrong (1969, July 21)
```

When used with Astro's MDX and the `rehype-tailwind-classes` plugin, the output includes comprehensive styling:

```html
<figure class="c-blockquote relative my-12 px-8 py-6 rounded-lg bg-gray-100 dark:bg-gray-800 border-l-4 border-[var(--color-primary)] before:content-['"'] before:absolute before:top-2 before:left-2 before:text-6xl before:font-serif before:leading-none before:text-[var(--color-primary)] before:opacity-30">
  <blockquote class="relative z-10 pl-8 border-0 my-0 font-serif text-xl italic text-[var(--color-text)]">
    <p class="mb-8 text-lg leading-relaxed">
      That's one small step for [a] man, one giant leap for mankind.
    </p>
  </blockquote>
  <figcaption class="c-blockquote__attribution mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 text-sm font-sans italic text-[var(--color-text-offset)] before:content-['—_'] before:text-[var(--color-primary)]">
    Neil Armstrong (1969, July 21)
  </figcaption>
</figure>
```

By default an `em dash` is used as the marker for an attribution line. Note that the `em dash` has to follow a soft break or has to be *the first character* of a new paragraph. This restriction should avoid situation in which an `em dash` is used within the body of a quotation. You can customize the characters used as an attribution marker. Have a look at the available [plugin options](#options) for more details.

## Usage

```js
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkAttribution from './index.ts';

const processor = remark()
  .use(remarkAttribution)
  .use(remarkRehype)
  .use(rehypeStringify);

const blockquote = [
  '> That\'s one small step for [a] man, one giant leap for mankind.',
  '> — Neil Armstrong (1969, July 21)'
];

const html = await processor.process(blockquote.join('\n'));
console.log(String(html));
```

### Astro/MDX Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkAttribution from './src/lib/markdown/remark-attribution/index.ts';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [
      remarkAttribution,
      // or with options:
      [remarkAttribution, {
        classNameContainer: 'c-quote',
        classNameAttribution: 'c-quote__attribution',
        marker: '--',
        removeMarker: false,
      }]
    ]
  }
});
```

### Options

You can customize the plugin behavior by providing custom options when you register the plugin:

```js
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkAttribution from './index.ts';

const processor = remark()
  .use(remarkAttribution, {
    classNameContainer: 'c-quote',
    classNameAttribution: 'c-quote__attribution',
    marker: '--',
    removeMarker: false,
  })
  .use(remarkRehype)
  .use(rehypeStringify);

const html = await processor.process('…');
```

List of available options:

* `[classNameContainer='c-blockquote']` - Select the HTML class added to the container of the `blockquote`.
* `[classNameAttribution='c-blockquote__attribution']` - Select the HTML class added to the container of an attribution line.
* `[marker='—']` - Select the characters used to identify the beginning of an attribution line.
* `[removeMarker=true]` - Determines whether the attribution marker will be included in the generated markup.

### Customization

The plugin uses the remark/rehype pipeline to generate HTML output. By default, it sets `data.hName` and `data.hProperties` on nodes to control the HTML structure. The transformation happens during the `remark-rehype` step.

If you need custom HTML elements, you can:

1. **Use rehype plugins** to modify the hast (HTML AST) after transformation
2. **Modify the plugin** to set different `hName` values
3. **Use CSS** to style the generated `<figure>` and `<figcaption>` elements

Example with a custom rehype plugin:

```js
import { visit } from 'unist-util-visit';

function customizeAttributionElements() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.properties?.className?.includes('c-blockquote')) {
        node.tagName = 'aside';
      }
      if (node.properties?.className?.includes('c-blockquote__attribution')) {
        node.tagName = 'div';
      }
    });
  };
}

const processor = remark()
  .use(remarkAttribution)
  .use(remarkRehype)
  .use(customizeAttributionElements)
  .use(rehypeStringify);
```
