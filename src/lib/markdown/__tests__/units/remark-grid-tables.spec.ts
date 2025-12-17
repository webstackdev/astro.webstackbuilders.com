import { describe, it, expect } from 'vitest'
import remarkGridTables from '@adobe/remark-gridtables'
import { mdast2hastGridTablesHandler, TYPE_TABLE } from '@adobe/mdast-util-gridtables'
import { processIsolated } from '@lib/markdown/helpers/processors'

describe('remark-gridtables (Layer 1: Isolated)', () => {
  it('should parse grid table syntax into a <table>', async () => {
    const markdown = [
      '+----------+-------------+',
      '| Feature  | Notes       |',
      '+==========+=============+',
      '| Grid     | *formatted* |',
      '+----------+-------------+',
    ].join('\n')

    const html = await processIsolated({
      markdown,
      plugin: remarkGridTables,
      remarkRehypeOptions: {
        handlers: {
          [TYPE_TABLE]: mdast2hastGridTablesHandler(),
        },
      },
    })

    expect(html).toContain('<table>')
    expect(html).toContain('<th>Feature</th>')
    expect(html).toContain('<td>Grid</td>')
    expect(html).toContain('<em>formatted</em>')
  })
})
