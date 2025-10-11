import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { inspect } from 'unist-util-inspect'

const markdown = '*test*{style="em:4"}'

const tree = unified()
  .use(remarkParse)
  .parse(markdown)

console.log(inspect(tree))
