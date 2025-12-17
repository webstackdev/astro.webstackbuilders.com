declare module '@adobe/remark-gridtables' {
  import type { Plugin } from 'unified'
  import type { Root } from 'mdast'

  type RemarkGridTablesOptions = Record<string, unknown>

  const remarkGridTables: Plugin<[RemarkGridTablesOptions?], Root>
  export default remarkGridTables
}
