// @ts-check
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkAbbr from 'remark-abbr'
import remarkAttr from 'remark-attr'
import remarkAttribution from './remark-attribution/index.mjs'
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import remarkLinkifyRegex from 'remark-linkify-regex'
import remarkToc from 'remark-toc'
/** Add custom CSS classes to Markdown-generated elements in this file */
import { rehypeTailwindClasses } from '../markdown/rehype-tailwind-classes.ts'

/** @typedef {import('@astrojs/mdx').MdxOptions} MdxOptions */
/** @type { Partial<MdxOptions>} */
export const markdownConfig = {
  /** Default is true. Swap characters for smart quotes, ©, ®, ™, ±, etc. */
  smartypants: true,
  /** Code syntax highlighting */
  syntaxHighlight: 'shiki',
  shikiConfig: {
    themes: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },
  remarkPlugins: [
    /** Define abbreviations at bottom file, and wraps their usage in <abbr> tags */
    remarkAbbr,
    /**
     * Add HTML attributes to elements using {.class #id key=value} syntax
     * Supports: headings, links, images, code blocks, lists, and bracketed spans
     * Example: [text content]{.class #id attr=value} creates <span> with attributes
     */
    [remarkAttr, { scope: 'permissive' }],
    /** Wrap blockquotes with attribution in semantic figure/figcaption markup */
    remarkAttribution,
    /** Add <br/> tag to single line breaks */
    remarkBreaks,
    /** Convert emoji syntax like :heart: to emoji images */
    remarkEmoji,
    /** Automatically convert URL-like text to links */
    remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i),
    /** Generate a table of contents from Markdown content */
    [remarkToc, { heading: "contents" }],
  ],
  rehypePlugins: [
    /** Add accessible names to emojis */
    rehypeAccessibleEmojis,
    /**
     * Add a class and prepend an icon to heading tags that have an id attribute set.
     * Astro uses Github Flavored Markup to add id attribute to headings like h1,
     * using the header title text converted to kebab-case
     */
    [rehypeAutolinkHeadings,
      {
        content: {
          type: 'element',
          tagName: 'span',
          properties: {
            className: 'anchor-link',
            ariaHidden: 'true',
          },
          children: [
            {
              type: 'text',
              value: '🔗',
            },
          ],
        },
      },
    ],
    /**
     * Automatically add Tailwind classes to markdown elements as
     * specified in src/lib/markdown/rehype-tailwind-classes.ts
     */
    rehypeTailwindClasses,
  ],
  remarkRehype: {
    /** Footnote label displayed to return to reference */
    footnoteBackLabel: "Back to reference 1",
    /** Footnote label displayed at start of footnote section */
    footnoteLabel: 'Footnotes',
  },
  /** Enable GitHub Flavored Markdown */
  gfm: true,
}
