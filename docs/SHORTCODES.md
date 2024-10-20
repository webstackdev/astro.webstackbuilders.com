# Table of Filters and Short Codes

These are the filters and short codes available in the Webstack Builders Corporate Website project.

Difference between filters and short codes is slight. Universal filters cannot be passed parameters other than the value to the left of the pipe. Short codes can also used a paired syntax to accept the content between the tags to be used as inputs, something not possible with filters.

Shortcodes are sugar over Nunjucks custom tags. Tags are special blocks that perform operations on sections of the template: `if`, `for`, `asyncEach`, `asyncAll`, `macro`, `set`, `extends`, `block`, `include`, `import`, `raw`, `filter`, and `call`.

## Table of Contents

- *Custom Universal Filters*
  - **`currentPage`**  Gets data for current page from collections using the page path.
  - **`dateToFormat`**  Convert ISO date to convenient format.
  - **`dateToISO`**  Convert date to ISO format.
  - **`dateFromISO`**  Convert date from ISO format.
  - **`exclude`**  Exclude an item from an array.
  - **`excludeItemFromCollection`**  Exclude an item from a collection, like the current page.
  - **`findById`**  Find item in associative array by key.
  - **`humanizeNumber`**  Print high numbers as "11K" for thousands.
  - **`identity`**  Identity filter for use in tests.
  - **`obfuscate`**  For obfuscating email addresses.
  - **`readableDate`**  Friendly date filter.
  - **`setExt`**  Sets or changes the extension on media files.
  - **`slice`** @TODO: This is also a built-in Nunjucks filter, why is it over-ridden?
  - **`withCategory`**  Filter a collection by category e.g. "articles".

- *Custom Nunjucks Filters*
  - **`absoluteUrl`**  Over-ride of plugin provided method in eleventy-plugin-rss.

- *Custom Short Codes*
  - **`canonical`**  Determine the canonical URL for a page.
  - **`customMarkdownShortcode`**  Allows using Markdown inside tags in a Nunjucks or other template file. @TODO: Maybe change this to just "markdown"?
  - **`icon`**  Returns `<svg>` block for using SVG icon sprite by icon name.
  - **`youtubeShortcode`**  Embed Youtube as shortcode in markdown by video ID.
  - **`year`**  Get the year as a four-digit number.

- *Custom Paired Short Codes*
  - **`callout`**  Return HTML tags to wrap provided content in a callout box
  - **`signup`**  Return HTML tags for a signup box

- *Custom Nunjucks Short Codes*
  - **`pageDescription`**  Get page description for meta headers.
  - **`pageSocialImg`**  Get page social share image to set in meta header.
  - **`pageTitle`**  Builds a string for use in the browser title bar, with site title, a separator, and page title.

- *Custom Nunjucks Async Short Codes*
  - **`asyncImageHandler`**  Return responsive image code snippet and creates optimized image.
  - **`htmlToAbsoluteUrls`**  Convert relative URLs to absolute URLs

- *Third-Party Eleventy Plugin Provided Short Codes*
  - **`highlight`**
  - **`toc`**

- *Nunjucks [Built-In Filters](https://mozilla.github.io/nunjucks/templating.html#builtin-filters)*
  - **`abs`**  Return the absolute value of the argument.
  - **`batch`**  Returns a list with the given number of items from a source list.
  - **`capitalize`**  Make the first letter uppercase, the rest lower case.
  - **`default`**  Provide a default value for a variable in case it is undefined or null.
  - **`dictsort`**  Sort a map of keys and values by the keys.
  - **`dump`**  Call `JSON.stringify` on an object and dump the result into the template for debugging.
  - **`escape`**  Convert the characters &, <, >, ‘, and ” in strings to HTML-safe sequences.
  - **`first`**  Get the first item in an array or the first letter if it's a string.
  - **`float`  Convert a value into a floating point. On failure, `0.0 `or a default is returned.
  - **`forceescape`**  Enforce HTML escaping. This will probably double escape variables.
  - **`groupby`**  Group a sequence of objects by a common attribute.
  - **`indent`**  Indent a string using spaces. Default is not to indent first line and indent 4 spaces.
  - **`int`**  Convert the value into an integer. If the conversion fails 0 is returned.
  - **`join`**  Return a string which is the concatenation of the strings in a sequence.
  - **`last`**  Get the last item in an array or the last letter if it is a string.
  - **`length`**  Return the length of an array or string, or the number of keys in an object
  - **`list`**  Convert the value into a list. If given a string the result will be a list of characters.
  - **`lower`**  Convert string to al. lower case.
  - **`nl2br`**  Replace new lines with `<br />` HTML elements
  - **`random`**  Select a random value from an array, changing everytime the page is refreshed.
  - **`reject`**  Filters a sequence of objects by rejecting the objects that succeed.
  - **`rejectattr`**  Filter a sequence of objects by applying a test to the specified attribute and rejecting the objects that succeed.
  - **`replace`**  Replace one item with another.
  - **`reverse`**  Reverse a string.
  - **`round`**  Round a number.
  - **`safe`**  Mark the value as safe so it is not automatically escaped.
  - **`select`**  Filters a sequence of objects by selecting the objects that pass a test.
  - **`selectattr`**  Filter a sequence of objects by applying a test to the specified attribute and selecting the objects that succeed.
  - **`slice`**  Slice an iterator and return a list of lists containing those items.
  - **`sort`**  Sort an array with the JavaScript `arr.sort` function.
  - **`string`**  Convert an object to a string.
  - **`striptags`**  strips SGML/XML tags and replaces adjacent whitespace with one space.
  - **`sum`**  Output the sum of items in the array.
  - **`title`**  Make the first letter of the string uppercase.
  - **`trim`**  Strip leading and trailing whitespace.
  - **`truncate`**  Return a truncated copy of the string.
  - **`upper`**  Convert the string to upper case.
  - **`urlencode`**  Escape strings for use in URLs, using UTF-8 encoding.
  - **`urlize`**  Convert URLs in plain text into anchor links.
  - **`wordcount`**  Count and output the number of words in a string.

- *Eleventy - Provided Filters*
  - **`url`**  Normalize absolute paths in your content with a subdirectory, useful for Netlify.
  - **`slugify`:`**  "My string" to "my-string" for permalinks.
  - **`log`**  `console.log` inside templates.
  - **`get*CollectionItem`**  Get next or previous collection items for easy linking.

---

## Renderer

---

Eleventy built-in plugin to [render templates](https://www.11ty.dev/docs/plugins/render/) from templates.

Use in `*.11ty.js` files:

```javascript
await this.renderTemplate(`# Title`)
```

Use in Nunjucks templates with Markdown:

```nunjucks
{% renderTemplate "md" %}
  # I am a title

  * I am a list
  * I am a list
{% endrenderTemplate %}
```

---

## Filters

---

Syntax:

```nunjucks
{{ foo | title }}
{{ foo | replace("foo", "bar") | capitalize }}
```

In code you can use the configuration object's  'getFilter' method to use a filter inside of another filter or shortcode.

---

### Collections Filters

---

#### currentPage

Gets the full data for the current page from collections using the page's path as a key

```nunjucks
{%- set currentPage = collections.all | currentPage(page) -%}
```

#### exclude

Usage:

```nunjucks
{%- set tags = article.data.tags | exclude("old") -%}
```

#### excludeItemFromCollection

Usage:

```nunjucks
{% set otherposts = collections.posts | excludeItemFromCollection(page) | slice(-10) %}
```

#### findById

Find item in associative array by key. Usage:

```nunjucks
{%- set dark = themes | findById('dark') -%}
```

#### slice

Usage:

```nunjucks
{% set otherposts = collections.posts | excludePost(page) | slice(-10) %}
```

#### withCategory

Usage:

```nunjucks
{%- set category = collections.categories | withCategory("articles") -%}
```

---

### Date Filters

---

#### dateToFormat

Usage:

```nunjucks
{{ build.timestamp | dateToFormat('yyyy') }}
{{ page.date | dateToFormat('yyyy') }}
```

#### dateToISO

Usage:

```nunjucks
<time dateTime="{{ article.date | dateToISO }}">{{ article.date | readableDate }}</time>
```

Result: `Friday, July 15, 2022 at 11:39:50 PM GMT+3`

#### dateFromISO

Usage:

```nunjucks
{{ webmention.published | dateFromISO | readableDate("dd LLL yyyy") }}
```

#### readableDate

Friendly date filter. Supported tokens [here](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens).

Usage:

```nunjucks
{{ date | readableDate('dd LLL yyyy') }}
```

---

### Identity Filter (tests only)

---

#### identity

Identity filter for use in tests.

```nunjucks
{{ `test` | identity }}
```

---

### Format Filters

---

#### humanizeNumber

Print high numbers as "11K" for thousands. Usage:

```nunjucks
{{ likeCount | humanizeNumber }}
```

#### obfuscate

Usage:

```nunjucks
<a href="mailto:{{ author.email | obfuscate | safe }}">
  {{ author.email | obfuscate | safe }}
</a>
```

#### setExt

Sets or changes the extension on media files. Usage:

```nunjucks
{{ imgsrc | setExt('webp') }}
```

---

### Webmentions Filters

---

**@TODO:** Not implemented yet

---

## Nunjucks Filters

### absoluteUrl

Over-ride of plugin provided absoluteUrl method from '@11ty/eleventy-plugin-rss'

```nunjucks
{%- set absolutePostUrl = article.url | absoluteUrl -%}
<a href="{{ 'feed.xml' | absoluteUrl }}"></a>
```

## Short Codes

### canonical

Determine the canonical URL for a page

```nunjucks
<link rel="canonical" href="{% canonical page %}">
```

### customMarkdownShortcode

Allows using Markdown inside tags in a Nunjucks or other template file

```nunjucks
NO CURRENT EXAMPLES
```

### icon

Returns <svg> block for using SVG icon sprite by icon name

```nunjucks
{% icon "close" %}
```

### youtubeShortcode

Embed Youtube as shortcode in markdown by video ID

```nunjucks
NO CURRENT EXAMPLES
```

### year

Get the year as a four-digit number

```nunjucks
NO CURRENT EXAMPLES
```
## Paired Short Codes

### callout

```nunjucks
{% callout %}
{% callout "warning" %}
```

### signup

```nunjucks
{% signup "By the way..." %}
```

## Nunjucks Short Codes

### pageDescription

Page description for meta headers

```nunjucks
{%- set pageDescription = description or autoDescription or site.description -%}
```

### pageSocialImg

Page social share image to set in meta header

```nunjucks
<meta property="og:image" content="{% pageSocialImg fileSlug %}" />
```

### pageTitle

Include the page name in the tab title if it's set

```nunjucks
{%- set pageTitle = title or site.title -%}
<title>{% pageTitle title %}</title>
```

## Nunjucks Async Short Codes

### asyncImageHandler

Return a possibly lazy loaded responsive image code snippet and creates optimized images

```nunjucks
{% asyncImageHandler cover, alt %}
```

### htmlToAbsoluteUrls

Convert relative URLs to absolute URLs.

```nunjucks
<![CDATA[{{ article.templateContent | htmlToAbsoluteUrls(absolutePostUrl) }}]]>
```

## Plugins

### highlight

Put this around text that should be highlighted for share, like the way Medium does:

```nunjucks
{% highlight %}Here's some highlighted text you can share!{% endhighlight %}
```

### toc

Generate table of contents from headings on page

```nunjucks
<aside>
  {{ content | toc | safe }}
  {{ content | toc(tags=['h2', 'h3'], wrapperClass='fixed toc') | safe }}
</aside>
```
