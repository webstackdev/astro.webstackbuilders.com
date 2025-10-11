import { remark } from 'remark'
import remarkAttr from './src/lib/markdown/remark-attr/index.ts'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { inspect } from 'unist-util-inspect'

const markdown = '*test*{style="em:4"}'

// First, let's see the AST before our plugin
const tree = remark().parse(markdown)
console.log('=== AST BEFORE PLUGIN ===')
console.log(inspect(tree))

// Now process with our plugin
const result = await remark()
  .use(remarkAttr)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(markdown)

console.log('\n=== HTML OUTPUT ===')
console.log(String(result))
