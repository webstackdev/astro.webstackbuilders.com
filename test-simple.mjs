import { remark } from 'remark'
import remarkAttr from './src/lib/markdown/remark-attr/index.ts'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const markdown = '*test*{style="em:4"}'

console.log('Input:', markdown)

const result = await remark()
  .use(remarkAttr)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(markdown)

console.log('Output:', String(result))
console.log('Expected: <em style="em:4">test</em>')
