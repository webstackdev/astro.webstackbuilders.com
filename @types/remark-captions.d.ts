declare module 'remark-captions' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  export type RemarkCaptionsExternalNodeType = 'table' | 'code'
  export type RemarkCaptionsInternalNodeType = 'blockquote' | 'image'

  export interface RemarkCaptionsOptions {
    external?: Partial<Record<RemarkCaptionsExternalNodeType, string>>
    internal?: Partial<Record<RemarkCaptionsInternalNodeType, string>>
  }

  const remarkCaptions: Plugin<[RemarkCaptionsOptions?], Root>
  export default remarkCaptions
}
