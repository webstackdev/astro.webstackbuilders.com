/**
 * Type definitions for remark-linkify-regex 1.2.1
 * Project: https://gitlab.com/staltz/remark-linkify-regex
 * Definitions by: TypeScript Generator
 */

declare module 'remark-linkify-regex' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  /**
   * Factory function that creates a remark plugin to convert regex matches
   * inside text nodes to link nodes.
   * @param _regex - Regular expression to match text that should be converted to links.
   * The matched text will be used as both the link URL and link text.
   * @returns A unified/remark plugin transformer
   * @example
   * ```ts
   * import remarkLinkifyRegex from 'remark-linkify-regex'
   * import { unified } from 'unified'
   * import remarkParse from 'remark-parse'
   *
   * unified()
   *   .use(remarkParse)
   *   .use(remarkLinkifyRegex(/\@[A-Za-z0-9]+\b/))
   *   .process('Hello @user123')
   * ```
   * @example
   * ```ts
   * // Linkify URLs
   * remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
   * ```
   */
  function remarkLinkifyRegex(_regex: RegExp): Plugin<[], Root>

  export default remarkLinkifyRegex
}
