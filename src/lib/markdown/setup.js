const markdownIt = require('markdown-it')
const markdownAnchor = require('markdown-it-anchor')

const { domain } = require('../../package.json')
const { markdownContainerWarning } = require('./markdownContainer')
const { slugifyTitleAnchors } = require('./util')

const markdownItLibConfig = {
  /** Convert '\n' in paragraphs into <br>, could also use CSS white-space property */
  breaks: true,
  /** Enable HTML tags in source, default false */
  html: true,
  /** Autoconvert URL-like text to links */
  linkify: false,
  /**
   * Swap characters for smart quotes, ©, ®, ™, ±, etc.
   */
  typographer: true,
  /** Use '/' to close single tags (<br />) for full CommonMark compatibility */
  xhtmlOut: false,

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externaly.
  // If result starts with <pre... internal wrapper is skipped.
  highlight: function (/*str, lang*/) {
    return ''
  },
}

/**
@TODO: Markdown filters need access to the markdownIt instance. From .eleventy.js file:
module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("markdown", function (rawString) {
    return markdown.renderInline(rawString);
  });
}
 */

/**
 * Renders header link with `title` being the Markdown document's heading text:
 *
 * <h2 id="title">
 *   Title
 *   <a className="header-anchor" href="#title" aria-hidden="true">🔗</a>
 * </h2>
 */
const markdownAnchorConfig = {
  /** Add anchor links only to h1, h2, and h3 elements */
  level: [1, 2, 3],
  /** Renders anchor w/ aria-hidden set to true so the html entity text for symbol isn't read */
  permalink: markdownAnchor.permalink.ariaHidden({
    /** class used for the <a> anchor element */
    class: 'heading-anchor',
    /** HTML entity for 🔗 */
    symbol: '&#128279;',
  }),
  /**
   * Uses a custom slugify function for title anchors. You can also explicitly set
   * the anchor ID using `markdown-it-attrs` as follows, for example to avoid
   * translated text being used for the ID so that it stays consistent across languages:
   *
   * # Title {#custom-id}
   */
  slugify: slugifyTitleAnchors,
}

/**
 * Generates accessible markup for block quotes with attribution line
 */
const markdownAttributionConfig = {
  /** HTML class added to the container of the blockquote */
  classNameContainer: 'c-quote',
  /** HTML class added to the <figcaption> element */
  classNameAttribution: 'c-quote__attribution',
  /** Characters used to identify the beginning of an attribution line */
  marker: '--',
  /** Whether the attribution marker will be included in the generated markup */
  removeMarker: false,
}

/**
 * Options for "copy" button added to code blocks
 */
const markdownCodeCopyConfig = {
  /** Text shown on copy button */
  btnText: `Copy`,
  /** Text shown on copy failure */
  failText: `Copy Failed`,
  /** Text shown on copy success */
  successText: `Success!`, // 'copy success' | copy-success text
  /** Amount of time to show success message */
  successTextDelay: 2000,
  /** An HTML fragment included before <button> */
  extraHtmlBeforeBtn: ``,
  /** An HTML fragment included after <button> */
  extraHtmlAfterBtn: ``,
  /** Whether to show code language before the copy button */
  showCodeLanguage: false,
  /** Test to append after the copied text like a copyright notice */
  attachText: ``,
}

/**
 * Mark external, absolute links with appropriate rel & target attributes
 */
const markdownExternalAnchorConfig = {
  /** The domain that is considered an internal link */
  domain: domain,
  /** A class name added to anchors */
  class: 'external-link',
}

/**
 * Add accessible name to section in footnotes plugin
 */
const markdownFootnoteBlockOpen = () =>
  '<hr className="footnotes-sep">\n' +
  '<section class="footnotes" aria-label="footnotes">\n' +
  '<ol class="footnotes-list">\n'

/**
 * Mermaid JavaScript based diagramming and charting tool
 */
const markdownMermaidConfig = {
  startOnLoad: false,
  securityLevel: true,
  theme: 'default',
  flowchart: {
    htmlLabels: false,
    useMaxWidth: true,
  },
  dictionary: {
    token: 'mermaid',
    graph: 'graph',
    sequenceDiagram: 'sequenceDiagram',
  },
  // ...or any other options
}

/**
 * Use Shiki for code syntax highlighting
 */
const markdownShikiConfig = {
  theme: 'github-dark',
  /*
  theme: {
    dark: 'github-dark',
    light: 'github-light'
  }
  */
}

/**
 * TeX rendering using KaTeX for math symbols
 */
const markdownTexmathConfig = {
  engine: require('katex'),
  delimiters: 'dollars',
  katexOptions: { macros: { '\\RR': '\\mathbb{R}' } },
}

/**
 *
 */
const markdownVideoConfig = {
  youtube: { width: 640, height: 390 },
}

/**
 * Options object including parse function for content generated
 * by mentions plugin using `@twittername` syntax.
 */
const markdownMentionsConfig = {
  parseURL: username => {
    return `https://twitter.com/@${username}`
  },
  /** adds a target="_blank" attribute if it's true and target="_self" if it's false */
  external: true,
}

/**
 * Markdown configuration
 */
const markdownItLib = markdownIt(markdownItLibConfig)
  /** Abbreviation element with title set for hover modal, list in abbreviations.njk */
  .use(require('markdown-it-abbr'))
  /** markdown-it-anchor for h1, h2, and h3 headings so that they can be permalinked to */
  .use(markdownAnchor, markdownAnchorConfig)
  /**
   * Adds role="list" to <ol> and <ul> elements to preserve accessibility when using
   * `list-style: none` or CSS that removes the bullet or number indicators of list items
   */
  .use(require('markdown-it-accessible-lists'))
  /** Generates accessible markup for block quotes with attribution line */
  .use(require('markdown-it-attribution'), markdownAttributionConfig)
  /** Add classes, IDs, and attributes w. curly braces: *span*{#extra .custom data-toggle=modal} */
  .use(require('markdown-it-attrs'))
  /** Add <span> elements to content in brackets, dependency on markdown-it-attrs: [text]{.test} */
  .use(require('markdown-it-bracketed-spans'))
  /**
   * Code tabs plugin so Javascript and Typescript examples can both be show. There can only
   * be white space between two code blocks. Display name is set by `tabName` and can only
   * contain characters in [A-Za-z0-9_]. Syntax for the first line of the code block is:
   * ```js [group:tabName]
   */
  .use(require('markdown-it-codetabs'))
  /** Create block containers like a warning block - ::: warning my content ::: */
  .use(require('markdown-it-container'), 'warning', markdownContainerWarning)
  /** Add copy button to code blocks */
  .use(require('markdown-it-copy'), markdownCodeCopyConfig)
  /** Definition lists, using indented ~ for definitions under definition header */
  .use(require('markdown-it-deflist'))
  /** Apache ECharts interactive charting and data visualization library for browser  */
  // @TODO: uses ES Modules, needs Jest config adjusted. See note in Mermaid plugin spec file.
  //.use(require('markdown-it-echarts'))
  /** Emoji filter for use in markdown: {{'✍️' | emoji('taking notes')}} */
  .use(require('markdown-it-emoji')) // takes an options object
  /** Expandable and collapsible content using HTML <details> and <summary> elements */
  .use(require('markdown-it-expandable'))
  /** Mark external, absolute links with appropriate rel & target attributes */
  .use(require('markdown-it-external-anchor'), markdownExternalAnchorConfig)
  /** Footnotes for markdown, see test for syntax */
  .use(require('markdown-it-footnote'))
  /** Add captions to markdown images: ![xx](yy "my caption") shows `my caption` as the caption */
  .use(require('markdown-it-image-caption'))
  /**Includes for markdown fragment files using !!![file.md]!!! syntax */
  .use(require('markdown-it-include'), './src/_layouts')
  /** Syntax highlighting to marked text: ==marked== => <mark>inserted</mark> */
  .use(require('markdown-it-mark'))
  /** Add Twitter like mentions in markdown using @twittername syntax */
  .use(require('markdown-it-mentions'), markdownMentionsConfig)
  /** Mermaid JavaScript based diagramming and charting tool */
  // @TODO: uses ES Modules, needs Jest config adjusted. See note in spec file.
  //.use(require('@liradb2000/markdown-it-mermaid'), markdownMermaidConfig)
  /** Add a curtain filename block into code blocks using ```js:<filename.js> syntax */
  // @TODO: conflicts with markdown-it-codetabs, need to debug
  //.use(require('markdown-it-named-code-blocks'))
  /** Textmark-based parsing of code blocks using VS Code templates */
  // @TODO: gives error, maybe about ES Module syntax: TypeError: plugin.apply is not a function
  //.use(require('markdown-it-shiki'), markdownShikiConfig)
  /** Subscript text: 29^th^ => <p>29<sup>th</sup></p> */
  .use(require('markdown-it-sub'))
  /** Superscript text: H~2~0 => <p>H<sub>2</sub>0</p> */
  .use(require('markdown-it-sup'))
  /** Create table of contents using [[toc]] shortcode from <h1> and <h2> headings*/
  .use(require('markdown-it-table-of-contents'))
  /** Github-stye Todo lists using checkboxes with - [ ] and - [x] markup */
  .use(require('markdown-it-task-lists'), { label: true, labelAfter: true })
  /** TeX rendering using KaTeX for math symbols */
  .use(require('markdown-it-texmath'), markdownTexmathConfig)
  /** Adds underline to markdown like _underline_ */
  // @TODO: conflicts with built-in markup for italics: _italics_ _underline_, change one
  //.use(require('markdown-it-underline'))
  /** Embed video: @[youtube](dQw4w9WgXcQ) */
  .use(require('markdown-it-video'), markdownVideoConfig)

markdownItLib.renderer.rules.footnote_block_open = markdownFootnoteBlockOpen
exports.markdownItLib = markdownItLib
