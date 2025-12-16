declare module '@adobe/mdast-util-gridtables' {
  export const TYPE_TABLE: string

  // This is a mdast-util-to-hast handler factory; typing varies by mdast-util-to-hast version.
  // Keep it permissive to avoid coupling tests/build to internal types.
  export function mdast2hastGridTablesHandler(..._args: Array<unknown>): unknown
}
