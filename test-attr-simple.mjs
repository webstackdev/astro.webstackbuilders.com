import { remark } from 'remark'
import { visit } from 'unist-util-visit'

const markdown = '*test*{style="em:4"}'

const tree = remark().parse(markdown)

console.log('=== AST Structure ===')
visit(tree, (node, index, parent) => {
  if (node.type === 'paragraph') {
    console.log('\nParagraph children:')
    node.children.forEach((child, i) => {
      console.log(`  [${i}] type: ${child.type}`, child.type === 'text' ? `value: "${child.value}"` : '')
    })
  }
  if (node.type === 'emphasis') {
    console.log('\nEmphasis node found at index:', index)
    if (parent) {
      console.log('Parent children count:', parent.children?.length)
      console.log('Next sibling:', parent.children?.[index + 1])
    }
  }
})
