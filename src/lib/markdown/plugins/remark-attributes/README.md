# `remark-attr`

This plugin adds support for custom attributes to Markdown syntax.

For **security reasons**, this plugin uses [html-element-attributes](https://github.com/wooorm/html-element-attributes).
The use of JavaScript attributes (`onload` for example) is not allowed by default.

## Default Syntax

### Images

~~~markdown
![alt](img){attrs} / ![alt](img){ height=50 }
~~~

### Links

~~~markdown
[rms with a computer](https://rms.sexy){rel="external"}
~~~

### Autolink

~~~markdown
Email me at : <mailto:falseEmail@example.org>
~~~

### Header (Atx)

~~~markdown
### This is a title
{style="color:red;"}

or

### This is a title {style="color:yellow;"}

If option enableAtxHeaderInline is set to `true` (default value).
~~~

### Header

~~~markdown
This is a title
---------------
{style="color: pink;"}
~~~

### Emphasis

~~~markdown
Npm stand for *node*{style="color:red"} packet manager.
~~~

### Strong

~~~markdown
This is a **Unicorn**{awesome} !
~~~

### Delete

~~~markdown
Your problem is ~~at line 18~~{style="color: grey"}. My mistake, it's at line 14.
~~~

### Code

~~~markdown
You can use the `fprintf`{language=c} function to format the output to a file.
~~~

### Footnote (using [remark-footnotes](https://github.com/remarkjs/remark-footnotes))

~~~markdown
This is a footnote[^ref]{style="opacity: 0.8;"}


[^ref]: And the reference.
~~~

## rehype

At the moment it aims is to be used with `rehype` only, using remark-rehype.

~~~md
[rms with a computer](https://rms.sexy){rel=external}
~~~

Produces:

~~~html
<a href="https://rms.sexy" rel="external">rms with a computer</a>
~~~

## Usage

~~~javascript
const testFile = `

Here a test :

![ache avatar](https://ache.one/res/ache.svg){ height=100 }

`

unified()
  .use(remarkParse)
  .use(remarkAttr)
  .use(remark2rehype)
  .use(stringify)
  .process( testFile, (err, file) => {
    console.log(String(file))
  } )
~~~

Output:

~~~shell
$ node index.js
<p>Here a test :</p>
<p><img src="https://ache.one/res/ache.svg" alt="ache avatar" height="100"></p>
~~~

## Options

### `options.allowDangerousDOMEventHandlers`

Whether to allow the use of `on-*` attributes. They are depreciated and disabled by default for security reasons. Its a boolean (default: `false`).
If allowed, DOM event handlers will be added to the **global scope**.

### `options.elements`

The list of elements which the attributes should be parsed.
It's a list of string, a sub-list of `SUPPORTED_ELEMENTS`.
If you are confident enough you can add the name of a tokenizer that isn't officially supported but remember that it will not have been tested.

### `options.extend`

An object that extends the list of attributes supported for some elements.

Example : `extend: {heading: ['original', 'quality', 'format', 'toc']}`

With this configuration, if the scope permits it, 4 mores attributes will be supported for atxHeading elements.

### `options.scope`

A string with the value `global` or `specific` or `extended` or `none` or `every`.

- `none` will disable the plugin.
- `global` will activate only the global attributes.
- `specific` will activate global and specific attributes.
- `extended` will add personalized tags for some elements.
- `permissive` or `every` will allow every attributes (except dangerous one) on every elements supported.

### `options.enableAtxHeaderInline`

Whether to allow atx headers with attributes on the same line.

~~~md
### This is a title {style="color:yellow;"}
~~~

### `option.SUPPORTED_ELEMENTS`

The names of the tokenizers and neither arbitrary names nor HTML tag names.
