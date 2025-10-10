# remark-attr

This project uses the `remark-attr` plugin to add HTML attributes to Markdown elements using a simple curly-brace syntax.

## Installation

Already installed as a dependency. See `package.json`.

## Usage

The plugin is configured in `src/lib/config/markdown.mjs` and is available for all `.md` and `.mdx` files.

## Syntax Examples

### Add Classes and IDs

```markdown
# Heading with class {.my-heading}

## Heading with ID {#custom-id}

### Heading with multiple attributes {.title .blue #main-title}
```

### Images with Attributes

```markdown
![Alt text](image.png){.responsive width=800 height=600}

![Logo](logo.svg){.center #site-logo}
```

### Links with Attributes

```markdown
[Click here](https://example.com){.btn .btn-primary target=_blank}

[External](https://example.com){rel=noopener}
```

### Bracketed Spans (Inline Elements)

Create `<span>` elements with custom attributes by wrapping text in brackets:

```markdown
[bar *bar*]{#id .class attr=value}

[Important text]{.highlight .bold}

[Tooltip text]{title="This is a tooltip" .info-tooltip}

Mix with [emphasized *content*]{.special-emphasis #note-1}
```

Output:

```html
<span id="id" class="class" attr="value">bar <em>bar</em></span>

<span class="highlight bold">Important text</span>

<span title="This is a tooltip" class="info-tooltip">Tooltip text</span>

<span class="special-emphasis" id="note-1">emphasized <em>content</em></span>
```

### Paragraphs and Text

```markdown
This is a paragraph {.lead}

Inline text with attributes {.highlight}
```

### Code Blocks

````markdown
```javascript {.line-numbers}
console.log('Hello world');
```
````

### Lists

```markdown
- List item {.special}
- Another item {data-value=123}
```

### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
{.striped .bordered}
```

## Common Patterns

### Highlighted or Colored Text

```markdown
This is [important text]{.text-red-600 .font-bold} in a paragraph.

Use [caution]{.text-yellow-500 .bg-yellow-50 .px-2 .py-1 .rounded} when proceeding.
```

### Keyboard Shortcuts

```markdown
Press [Ctrl+C]{.kbd .bg-gray-200 .px-2 .py-1 .rounded .font-mono} to copy.
```

### Tooltips and Hints

```markdown
Hover over [this text]{title="Additional information" .cursor-help .border-b .border-dotted} for more info.
```

### Badges and Labels

```markdown
[New]{.badge .bg-blue-500 .text-white .px-2 .py-1 .rounded-full .text-xs}
[Beta]{.badge .bg-orange-400 .text-white .px-2 .py-1 .rounded-full .text-xs}
```

### Responsive Images

```markdown
![Product](product.jpg){.img-fluid .rounded width=100%}
```

### Button Links

```markdown
[Get Started](/start){.btn .btn-lg .btn-primary}
```

### Custom Data Attributes

```markdown
# Section Title {data-section=intro data-theme=dark}
```

## Notes

- Attributes must be placed immediately after the element (no spaces)
- Classes are prefixed with `.` (e.g., `.my-class`)
- IDs are prefixed with `#` (e.g., `#my-id`)
- Other attributes use `key=value` syntax
- Multiple attributes are space-separated within the curly braces

## See Also

- [remark-attr documentation](https://github.com/arobase-che/remark-attr)
- [Markdown syntax guide](https://www.markdownguide.org/)
