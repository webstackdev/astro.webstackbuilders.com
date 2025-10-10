/**
 * Type definitions for remark-attr
 *
 * A remark plugin to add support for custom attributes to Markdown syntax.
 *
 * @see https://github.com/arobase-che/remark-attr
 */

declare module 'remark-attr' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  /**
   * Options for remark-attr plugin
   */
  export interface RemarkAttrOptions {
    /**
     * Scope of the attributes assignment
     * - 'global': attributes are assigned to the global scope
     * - 'specific': attributes are assigned to specific elements only
     * - 'none': no attributes assignment
     *
     * @default 'global'
     */
    scope?: 'global' | 'specific' | 'none'

    /**
     * Elements that can have attributes
     * Only used when scope is 'specific'
     */
    elements?: string[]

    /**
     * Extend the default elements list
     * Only used when scope is 'specific'
     */
    extend?: Record<string, string[]>

    /**
     * Markdown extensions to enable
     */
    mdAttrConfig?: {
      /**
       * Enable markdown attributes in fenced code blocks
       * @default true
       */
      enableAttrParsing?: boolean

      /**
       * Disable specific markdown elements from having attributes
       */
      disable?: string[]
    }
  }

  /**
   * Remark plugin to add custom attributes to Markdown elements.
   *
   * Allows using syntax like:
   * - `# Heading {.class #id}`
   * - `![image](url){width=100}`
   * - `Text with attributes {key=value}`
   *
   * @example
   * ```typescript
   * import { remark } from 'remark'
   * import remarkAttr from 'remark-attr'
   *
   * const processor = remark().use(remarkAttr)
   * ```
   *
   * @example With options
   * ```typescript
   * import { remark } from 'remark'
   * import remarkAttr from 'remark-attr'
   *
   * const processor = remark().use(remarkAttr, {
   *   scope: 'specific',
   *   elements: ['link', 'image']
   * })
   * ```
   */
  const remarkAttr: Plugin<[RemarkAttrOptions?] | [], Root>

  export default remarkAttr
}
