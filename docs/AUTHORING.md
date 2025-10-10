# Authoring in Markdown

## Abbreviations

```markdown
This plugin works on MDAST, a Markdown AST
implemented by [remark](https://github.com/remarkjs/remark)

*[MDAST]: Markdown Abstract Syntax Tree.
*[AST]: Abstract syntax tree
```

Will compile to the following HTML:

```html
<p>This plugin works on <abbr title="Markdown Abstract Syntax Tree.">MDAST</abbr>, a Markdown <abbr title="Abstract syntax tree">AST</abbr>
implemented by <a href="https://github.com/remarkjs/remark">remark</a></p>
```

## Anchors

You can use standard HTML anchor tags (`<a name="unique-anchor-name"></a>`) to create navigation anchor points for any location in the document. To avoid ambiguous references, use a unique naming scheme for anchor tags, such as adding a prefix to the `name` attribute value.

```markdown
# Section Heading

Some body text of this section.

<a name="my-custom-anchor-point"></a>
Some text I want to provide a direct link to, but which doesn't have its own heading.

(… more content…)

[A link to that custom anchor](#my-custom-anchor-point)
```

## Attributes

Add HTML attributes to any Markdown element using curly brace syntax:

```markdown
# Heading {.my-class #my-id}
![Image](url){width=300 .centered}
[Link](url){.btn target=_blank}
```

## Attribution

The plugin allows to provide an attribution for a quotation:

```markdown
> That's one small step for [a] man, one giant leap for mankind.
> — Neil Armstrong (1969, July 21)
```

The generated markup is not only accessible for screen readers but allows you to style the attribution line however you like:

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

## Comments

You can tell GitHub to hide content from the rendered Markdown by placing the content in an HTML comment.

```markdown
<!-- This content will not appear in the rendered Markdown -->
```

## Images

You can display an image by adding ! and wrapping the alt text in `[ ]`. Alt text is a short text equivalent of the information in the image. Then, wrap the link for the image in parentheses `()`.

## Lists

You can make an unordered list by preceding one or more lines of text with -, *, or +. To order a list, precede each line with a number.

### Nested Lists

You can create a nested list by indenting one or more list items below another item.

### Task lists

To create a task list, preface list items with a hyphen and space followed by `[ ]`. To mark a task as complete, use `[x]`.

```markdown
- [x] #739
- [ ] https://github.com/octo-org/octo-repo/issues/740
- [ ] Add delight to the experience when all tasks are complete :tada:
```

## Quoted Text

You can quote text with a >.

```markdown
Text that is not a quote

> Text that is a quote
```

## Tables

Organize data in a table using pipes (`|`) and hyphens (`-`). 

## Text

You can indicate emphasis with bold, italic, strikethrough, subscript, or superscript text in comment fields and `.md` files.

| Style                  | Syntax             | Keyboard shortcut                         | Example                                  | Output                                   |
| ---------------------- | ------------------ | ----------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Bold                   | `** **` or `__ __` | Command+B (Mac) or Ctrl+B (Windows/Linux) | `**This is bold text**`                  | **This is bold text**                    |
| Italic                 | `* *` or `_ _`     | Command+I (Mac) or Ctrl+I (Windows/Linux) | `_This text is italicized_`              | *This text is italicized*                |
| Strikethrough          | `~~ ~~` or `~ ~`   | None                                      | `~~This was mistaken text~~`             | ~~This was mistaken text~~               |
| Bold and nested italic | `** **` and `_ _`  | None                                      | `**This text is _extremely_ important**` | **This text is \*extremely\* important** |
| All bold and italic    | `*** ***`          | None                                      | `***All this text is important***`       | ***All this text is important***         |
| Subscript              | `<sub> </sub>`     | None                                      | `This is a <sub>subscript</sub> text`    | This is a subscript text                 |
| Superscript            | `<sup> </sup>`     | None                                      | `This is a <sup>superscript</sup> text`  | This is a superscript text               |
| Underline              | `<ins> </ins>`     | None                                      | `This is an <ins>underlined</ins> text`  | This is an underlined text               |
