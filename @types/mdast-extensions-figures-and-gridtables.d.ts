import type { Parent } from 'unist'

declare module 'mdast' {
  /** Custom node emitted by remark-captions / remark-attribution */
  interface Figure extends Parent {
    type: 'figure'
    children: Array<RootContent>
  }

  /** Custom node emitted by remark-captions / remark-attribution */
  interface Figcaption extends Parent {
    type: 'figcaption'
    children: Array<PhrasingContent>
  }

  /** Custom node emitted by @adobe/remark-gridtables */
  interface GridTable extends Parent {
    type: 'gridTable'
    children: Array<RootContent>
  }

  interface RootContentMap {
    figure: Figure
    figcaption: Figcaption
    gridTable: GridTable
  }
}
