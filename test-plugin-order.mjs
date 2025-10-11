import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkAttribution from './src/lib/markdown/remark-attribution/index.js';

const markdown = `> That's ~~not~~ **definitely** one small step.
> — Neil Armstrong`;

console.log('=== Test 1: GFM BEFORE Attribution (current setup) ===');
try {
  const result1 = await remark()
    .use(remarkGfm)
    .use(remarkAttribution)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  const html1 = String(result1);
  console.log(html1);
  console.log('Has <figure>?', html1.includes('<figure'));
  console.log('Has attribution?', html1.includes('Neil Armstrong'));
} catch (e) {
  console.error('Error:', e.message);
}

console.log('\n=== Test 2: Attribution BEFORE GFM (proposed fix) ===');
try {
  const result2 = await remark()
    .use(remarkAttribution)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  const html2 = String(result2);
  console.log(html2);
  console.log('Has <figure>?', html2.includes('<figure'));
  console.log('Has attribution?', html2.includes('Neil Armstrong'));
} catch (e) {
  console.error('Error:', e.message);
}
