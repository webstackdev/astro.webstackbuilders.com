import type { MdxOptions } from '@astrojs/mdx'
import type { ShikiConfig } from 'astro/'
import type { Options as RemarkTocOptions } from 'remark-toc'
import type { Options as RehypeAutolinkHeadingsOptions } from 'rehype-autolink-headings'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
// Use our TypeScript implementations (modern Remark API)
import remarkAbbr from '../markdown/plugins/remark-abbr/index'
import remarkAttr from '../markdown/plugins/remark-attr/index'
import remarkAttribution from '../markdown/plugins/remark-attribution/index'
import remarkReplacements from '../markdown/plugins/remark-replacements/index'
// These plugins are from npm (no custom implementation)
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import remarkLinkifyRegex from 'remark-linkify-regex'
import remarkToc from 'remark-toc'
/** Add custom CSS classes to Markdown-generated elements in this file */
import { rehypeTailwindClasses } from '../markdown/plugins/rehype-tailwind'

/** Configuration for remark-attr plugin */
export const remarkAttrConfig = { scope: 'permissive' } as const

/** Configuration for remark-toc plugin */
export const remarkTocConfig: RemarkTocOptions = { heading: 'contents' }

/** Configuration for rehype-autolink-headings plugin */
export const rehypeAutolinkHeadingsConfig: RehypeAutolinkHeadingsOptions = {
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
}

export const shikiConfigOptions: ShikiConfig = {
  // Alternatively, provide multiple themes
  // See note below for using dual light/dark themes
  themes: {
    light: 'github-light',
    dark: 'github-dark',
  },
  // Disable the default colors
  // https://shiki.style/guide/dual-themes#without-default-color
  // (Added in v4.12.0)
  defaultColor: 'light',
  // Add custom aliases for languages
  // Map an alias to a Shiki language ID: https://shiki.style/languages#bundled-languages
  // https://shiki.style/guide/load-lang#custom-language-aliases
  langAlias: {
    js: 'javascript',
    ts: 'typescript',
    md: 'markdown',
  },
  // Enable word wrap to prevent horizontal scrolling
  wrap: true,
  // Add custom transformers: https://shiki.style/guide/transformers
  // Find common transformers: https://shiki.style/packages/transformers
  transformers: [],
}

/** Configuration for remark-rehype plugin (conversion from markdown to HTML AST) */
export const remarkRehypeConfig = {
  /** Footnote label displayed to return to reference */
  footnoteBackLabel: 'Back to reference 1',
  /** Footnote label displayed at start of footnote section */
  footnoteLabel: 'Footnotes',
} as const

export const markdownConfig: Partial<MdxOptions> = {
  /** Default is true. Enable GitHub Flavored Markdown */
  gfm: true,
  /** Default is true. Swap characters for smart quotes, ©, ®, ™, ±, etc. */
  smartypants: true,
  /** Code syntax highlighting */
  syntaxHighlight: { type: 'shiki', excludeLangs: ['math'] },
  shikiConfig: shikiConfigOptions,
  remarkPlugins: [
    /** Define abbreviations at bottom file, and wraps their usage in <abbr> tags */
    remarkAbbr,
    /**
     * Add HTML attributes to elements using {.class #id key=value} syntax
     * Supports: headings, links, images, code blocks, lists, and bracketed spans
     * Example: [text content]{.class #id attr=value} creates <span> with attributes
     */
    [remarkAttr, remarkAttrConfig],
    /** Wrap blockquotes with attribution in semantic figure/figcaption markup */
    remarkAttribution,
    /** Add <br/> tag to single line breaks */
    remarkBreaks,
    /** Convert emoji syntax like :heart: to emoji images */
    remarkEmoji,
    /** Automatically convert URL-like text to links */
    remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i),
    /**
     * Typographic replacements for arrows, fractions, and math symbols
     * Complements smartypants (which handles quotes, dashes, ellipsis)
     * Converts: -->, <--, <=>, 1/2, 2 x 4, +-, etc.
     */
    remarkReplacements,
    /** Generate a table of contents from Markdown content */
    [remarkToc, remarkTocConfig],
  ],
  rehypePlugins: [
    /** Add accessible names to emojis */
    rehypeAccessibleEmojis,
    /**
     * Add a class and prepend an icon to heading tags that have an id attribute set.
     * Astro uses Github Flavored Markup to add id attribute to headings like h1,
     * using the header title text converted to kebab-case
     */
    [rehypeAutolinkHeadings, rehypeAutolinkHeadingsConfig],
    /**
     * Automatically add Tailwind classes to markdown elements as
     * specified in src/lib/markdown/rehype-tailwind-classes.ts
     */
    rehypeTailwindClasses,
  ],
  remarkRehype: remarkRehypeConfig,
}
