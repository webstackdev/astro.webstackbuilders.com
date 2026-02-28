import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkRestoreTimeColons from './src/lib/markdown/plugins/remark-restore-time-colons/index.ts';

const tests = [
  { input: 'At 2:47 AM, all inter-service communication fails.', expected: '2:47 AM' },
  { input: 'At 11:59:59 PM things changed.', expected: '11:59:59 PM' },
  { input: 'The time was 3:30 PM.', expected: '3:30 PM' },
  { input: 'Reset at 12:00:01 exactly.', expected: '12:00:01' },
  { input: '95 requests at 11:59:59 and 95 more at 12:00:01 — 190 requests.', expected: '11:59:59 and 95 more at 12:00:01' },
  { input: 'At 2:47 AM, the alert fired. By 3:15 PM it was resolved.', expected: '2:47 AM' },
  // Real directives should NOT be affected
  { input: ':::video{src="/videos/demo.mp4"}\nVideo caption\n:::', expected: null },
];

let passed = 0;
let failed = 0;

for (const { input, expected } of tests) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkRestoreTimeColons)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(input);

  const output = String(result);
  const ok = expected === null || output.includes(expected);

  if (ok) {
    passed++;
    console.log(`✓ PASS: "${input.slice(0, 60)}"`);
  } else {
    failed++;
    console.log(`✗ FAIL: "${input.slice(0, 60)}"`);
    console.log(`  Expected to contain: ${expected}`);
    console.log(`  Got: ${output}`);
  }

  // Also check no empty <div></div> in output (except for real directives)
  if (expected !== null && output.includes('<div></div>')) {
    console.log(`  ✗ STILL CONTAINS <div></div>: ${output}`);
    failed++;
    passed--;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
