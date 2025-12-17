import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
import remarkDirective from 'remark-directive'

type MdastNode = {
  type?: string
  name?: string
  children?: MdastNode[]
}

function findNode(root: MdastNode, predicate: (_node: MdastNode) => boolean): MdastNode | undefined {
  if (predicate(root)) return root
  for (const child of root.children ?? []) {
    const found = findNode(child, predicate)
    if (found) return found
  }
  return undefined
}

describe('remark-directive (Layer 1: Isolated)', () => {
  it('should parse container directives into mdast directive nodes', async () => {
    const markdown = [':::note', 'Hello', ':::'].join('\n')

    const processor = remark().use(remarkDirective)
    const tree = processor.parse(markdown)
    const transformed = await processor.run(tree)

    const note = findNode(transformed as MdastNode, node => node.type === 'containerDirective' && node.name === 'note')
    expect(note).toBeDefined()
  })
})
