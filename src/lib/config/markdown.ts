/**
 * Markdown Configuration
 *
 * Overrides of function names with Object.defineProperty is to
 * provide for better debugging
 *
 * NOTE: Use of path alias for markdown folder in this file causes
 * self referential compile error
 */
import type { MdxOptions } from '@astrojs/mdx'
import type { ShikiConfig } from 'astro/'
// import { transformerNotationDiff } from '@shiki/transformers'

import { rehypeHeadingIds } from '@astrojs/markdown-remark'
Object.defineProperty(rehypeHeadingIds, 'name', { value: 'rehypeHeadingIds' })

/**
 * ==============================================================
 *
 * Rehype plugins
 *
 * ==============================================================
 */

import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
Object.defineProperty(rehypeAccessibleEmojis, 'name', { value: 'rehypeAccessibleEmojis' })

import type { Options as RehypeAutolinkHeadingsOptions } from 'rehype-autolink-headings'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
Object.defineProperty(rehypeAutolinkHeadings, 'name', { value: 'rehypeAutolinkHeadings' })

/**
 * ==============================================================
 *
 * Remark plugins
 *
 * ==============================================================
 */

import remarkBreaks from 'remark-breaks'
Object.defineProperty(remarkBreaks, 'name', { value: 'remarkBreaks' })

import remarkEmoji from 'remark-emoji'
Object.defineProperty(remarkEmoji, 'name', { value: 'remarkEmoji' })

import remarkLinkifyRegex from 'remark-linkify-regex'

/**
 * ==============================================================
 *
 * Project TypeScript implementations (modern Remark API)
 *
 * ==============================================================
 */

import remarkAbbreviations from '../markdown/plugins/remark-abbreviations'
Object.defineProperty(remarkAbbreviations, 'name', { value: 'remarkAbbreviations' })

import remarkAttributes from '../markdown/plugins/remark-attributes'
Object.defineProperty(remarkAttributes, 'name', { value: 'remarkAttributes' })

import remarkAttribution from '../markdown/plugins/remark-attribution'
Object.defineProperty(remarkAttribution, 'name', { value: 'remarkAttribution' })

import remarkReplacements from '../markdown/plugins/remark-replacements'
Object.defineProperty(remarkReplacements, 'name', { value: 'remarkReplacements' })

import remarkSmartypants, { type RemarkSmartypantsOptions } from '../markdown/plugins/remark-smartypants'
Object.defineProperty(remarkSmartypants, 'name', { value: 'remarkSmartypants' })

/** Add custom CSS classes to Markdown-generated elements in this file */
import { rehypeTailwindClasses } from '../markdown/plugins/rehype-tailwind'
Object.defineProperty(rehypeTailwindClasses, 'name', { value: 'rehypeTailwindClasses' })

/**
 * ==============================================================
 *
 * Constants
 *
 * ==============================================================
 */

/** Named instance of remarkLinkifyRegex for URL auto-linking */
const remarkLinkifyRegexUrls = remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
Object.defineProperty(remarkLinkifyRegexUrls, 'name', { value: 'remarkLinkifyRegex' })

/**
 * ==============================================================
 *
 * Configuration
 *
 * ==============================================================
 */

/** remark-attributes plugin */
export const remarkAttributesConfig = { scope: 'permissive' } as const

/** rehype-autolink-headings plugin */
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

/** remark-smartypants plugin */
const remarkSmartypantsConfig: RemarkSmartypantsOptions = {
  /**
   * Transform backticks; when true, turns double backticks into an opening double quote
   * and double straight single quotes into a closing double quote; when 'all', does that
   * and turns single backticks into an opening single quote and a straight single quotes
   * into a closing single smart quote; quotes: false must be used with backticks: 'all'.
   */
  backticks: true,
  /**
   * Closing quotes to use.
   */
  closingQuotes: {
    double: '\u201D',
    single: '\u2019',
  },
  /**
   * Transform dashes; when true, turns two dashes into an em dash character; when
   * 'oldschool', turns three dashes into an em dash and two into an en dash; when
   * 'inverted', turns three dashes into an en dash and two into an em dash.
   */
  dashes: 'oldschool',
  /**
   * Transform triple dots; when 'spaced', turns triple dots with spaces into ellipses;
   * when 'unspaced', turns triple dots without spaces into ellipses; when true, turns
   * triple dots with or without spaces into ellipses.
   */
  ellipses: true,
  /**
   * Opening quotes to use.
   */
  openingQuotes: {
    double: '\u201C',
    single: '\u2018',
  },
  /**
   * Transform straight quotes into smart quotes.
   */
  quotes: true,
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

/** remark-rehype plugin (conversion from markdown to HTML AST) */
export const remarkRehypeConfig = {
  /** Footnote label displayed to return to reference */
  footnoteBackLabel: 'Back to reference 1',
  /** Footnote label displayed at start of footnote section */
  footnoteLabel: 'Footnotes',
} as const

/**
 * ==============================================================
 *
 * Exported Markdown configuration
 *
 * ==============================================================
 */
export const markdownConfig: Partial<MdxOptions> = {
  /** Default is true. Enable GitHub Flavored Markdown */
  gfm: true,
  /** Disabled because we include `remarkSmartypants` explicitly (test coverage + avoid double-processing). */
  smartypants: false,
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
    /** Smart quotes, dashes, and ellipsis */
    [remarkSmartypants, remarkSmartypantsConfig],
  ],
  rehypePlugins: [
    /** Inject heading ids before plugins that rely on them */
    rehypeHeadingIds,
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
