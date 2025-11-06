/**
 * Markdown Configuration
 *
 * Overrides of function names is to provide for better debugging
 */

import type { MdxOptions } from '@astrojs/mdx'
import type { ShikiConfig } from 'astro/'
// import { transformerNotationDiff } from '@shiki/transformers'

/** Rehype plugins */

import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
Object.defineProperty(rehypeAccessibleEmojis, 'name', { value: 'rehypeAccessibleEmojis' })

import type { Options as RehypeAutolinkHeadingsOptions } from 'rehype-autolink-headings'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
Object.defineProperty(rehypeAutolinkHeadings, 'name', { value: 'rehypeAutolinkHeadings' })

/** Remark plugins */
import remarkBreaks from 'remark-breaks'
Object.defineProperty(remarkBreaks, 'name', { value: 'remarkBreaks' })

import remarkEmoji from 'remark-emoji'
Object.defineProperty(remarkEmoji, 'name', { value: 'remarkEmoji' })

import remarkLinkifyRegex from 'remark-linkify-regex'

import type { Options as RemarkTocOptions } from 'remark-toc'
import remarkToc from 'remark-toc'
Object.defineProperty(remarkToc, 'name', { value: 'remarkToc' })

// Create a named instance of remarkLinkifyRegex for URL auto-linking
const remarkLinkifyRegexUrls = remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
Object.defineProperty(remarkLinkifyRegexUrls, 'name', { value: 'remarkLinkifyRegex' })

// Use our TypeScript implementations (modern Remark API)
import remarkAbbreviations from '../markdown/plugins/remark-abbreviations'
Object.defineProperty(remarkAbbreviations, 'name', { value: 'remarkAbbreviations' })

import remarkAttributes from '../markdown/plugins/remark-attributes'
Object.defineProperty(remarkAttributes, 'name', { value: 'remarkAttributes' })

import remarkAttribution from '../markdown/plugins/remark-attribution'
Object.defineProperty(remarkAttribution, 'name', { value: 'remarkAttribution' })

import remarkReplacements from '../markdown/plugins/remark-replacements'
Object.defineProperty(remarkReplacements, 'name', { value: 'remarkReplacements' })

/** Add custom CSS classes to Markdown-generated elements in this file */
import { rehypeTailwindClasses } from '../markdown/plugins/rehype-tailwind'
Object.defineProperty(rehypeTailwindClasses, 'name', { value: 'rehypeTailwindClasses' })

/** Configuration for remark-attributes plugin */
export const remarkAttributesConfig = { scope: 'permissive' } as const

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
  // transformers: [
  //   transformerNotationDiff,
  // ],
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
    remarkAbbreviations,
    /**
     * Add HTML attributes to elements using {.class #id key=value} syntax
     * Supports: headings, links, images, code blocks, lists, and bracketed spans
     * Example: [text content]{.class #id attr=value} creates <span> with attributes
     */
    [remarkAttributes, remarkAttributesConfig],
    /** Wrap blockquotes with attribution in semantic figure/figcaption markup */
    remarkAttribution,
    /** Add <br/> tag to single line breaks */
    remarkBreaks,
    /** Convert emoji syntax like :heart: to emoji images */
    remarkEmoji,
    /** Automatically convert URL-like text to links */
    remarkLinkifyRegexUrls,
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
