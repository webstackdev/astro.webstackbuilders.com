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

The generated markup is not only accessible for screen readers but allows you to style the attribution line however you like:

```html
<figure class="c-blockquote">
  <blockquote>
    <p>
      That's one small step for [a] man, one giant leap for mankind.
    </p>
  </blockquote>
  <figcaption class="c-blockquote__attribution">
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
import remarkAttribution from './index.mjs';

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
import remarkAttribution from './src/lib/config/remark-attribution/index.mjs';

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
import remarkAttribution from './index.mjs';

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

- `[classNameContainer='c-blockquote']` - Select the HTML class added to the container of the `blockquote`.
- `[classNameAttribution='c-blockquote__attribution']` - Select the HTML class added to the container of an attribution line.
- `[marker='—']` - Select the characters used to identify the beginning of an attribution line.
- `[removeMarker=true]` - Determines whether the attribution marker will be included in the generated markup.

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
