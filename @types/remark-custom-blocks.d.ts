/**
 * Type definitions for remark-custom-blocks
 *
 * The package does not currently ship TypeScript types.
 */

declare module 'remark-custom-blocks' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  export type CustomBlockTitleRequirement = 'required' | 'optional' | 'none'

  export type CustomBlockDefinition = {
    classes?: string
    title?: CustomBlockTitleRequirement
    containerElement?: string
    titleElement?: string
    contentsElement?: string
    details?: boolean
  }

  export type RemarkCustomBlocksOptions = Record<string, CustomBlockDefinition>

  const remarkCustomBlocks: Plugin<[RemarkCustomBlocksOptions?] | [], Root>

  export default remarkCustomBlocks
}
