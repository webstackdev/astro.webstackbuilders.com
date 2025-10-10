/**
 * Type definitions for remark-abbr
 *
 * A remark plugin to parse and render abbreviations with <abbr> tags.
 *
 * @see https://github.com/zestedesavoir/zmarkdown/tree/master/packages/remark-abbr
 */

declare module 'remark-abbr' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  /**
   * Options for remark-abbr plugin
   */
  export interface RemarkAbbrOptions {
    /**
     * Whether to expand abbreviations in the output
     * @default false
     */
    expandFirst?: boolean
  }

  /**
   * Remark plugin to parse abbreviation definitions and wrap them in <abbr> tags.
   *
   * Abbreviations are defined at the bottom of the markdown file using:
   * ```
   * *[HTML]: Hyper Text Markup Language
   * *[CSS]: Cascading Style Sheets
   * ```
   *
   * When HTML or CSS appears in the text, it will be wrapped in <abbr title="..."> tags.
   *
   * @example
   * ```typescript
   * import { remark } from 'remark'
   * import remarkAbbr from 'remark-abbr'
   *
   * const processor = remark().use(remarkAbbr)
   * ```
   *
   * @example With options
   * ```typescript
   * import { remark } from 'remark'
   * import remarkAbbr from 'remark-abbr'
   *
   * const processor = remark().use(remarkAbbr, {
   *   expandFirst: true
   * })
   * ```
   */
  const remarkAbbr: Plugin<[RemarkAbbrOptions?] | [], Root>

  export default remarkAbbr
}
