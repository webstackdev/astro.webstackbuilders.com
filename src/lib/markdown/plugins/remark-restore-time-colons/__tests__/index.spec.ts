/**
 * Tests for remark-restore-time-colons plugin
 *
 * Verifies that numeric-only directive nodes created by remark-directive
 * (e.g. `:47` from "2:47 AM") are restored to plain text while leaving
 * real directives like :::video intact.
 */
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkRestoreTimeColons from '@lib/markdown/plugins/remark-restore-time-colons'

/**
 * Process markdown through remarkDirective + remarkRestoreTimeColons and
 * return the rendered HTML string.
 */
async function processToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkRestoreTimeColons)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

/**
 * Process markdown through remarkDirective WITHOUT the fix, to confirm
 * the baseline is broken.
 */
async function processWithoutFix(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

describe('remark-restore-time-colons', () => {
  describe('baseline: confirms remarkDirective corrupts time strings', () => {
    it('corrupts H:MM time patterns without the fix', async () => {
      const output = await processWithoutFix('At 2:47 AM the alert fired.')
      expect(output).toContain('<div></div>')
      expect(output).not.toContain('2:47')
    })

    it('corrupts HH:MM:SS time patterns without the fix', async () => {
      const output = await processWithoutFix('Reset at 11:59:59 PM.')
      expect(output).toContain('<div></div>')
      expect(output).not.toContain('11:59:59')
    })
  })

  describe('single time strings', () => {
    it('preserves H:MM AM format (2:47 AM)', async () => {
      const output = await processToHtml('At 2:47 AM the alert fired.')
      expect(output).toContain('2:47 AM')
      expect(output).not.toContain('<div></div>')
    })

    it('preserves H:MM PM format (3:30 PM)', async () => {
      const output = await processToHtml('The time was 3:30 PM.')
      expect(output).toContain('3:30 PM')
      expect(output).not.toContain('<div></div>')
    })

    it('preserves HH:MM format (12:00)', async () => {
      const output = await processToHtml('Starts at 12:00 sharp.')
      expect(output).toContain('12:00')
      expect(output).not.toContain('<div></div>')
    })

    it('preserves HH:MM:SS format (11:59:59)', async () => {
      const output = await processToHtml('At 11:59:59 PM things changed.')
      expect(output).toContain('11:59:59')
      expect(output).not.toContain('<div></div>')
    })

    it('preserves HH:MM:SS format (12:00:01)', async () => {
      const output = await processToHtml('Reset at 12:00:01 exactly.')
      expect(output).toContain('12:00:01')
      expect(output).not.toContain('<div></div>')
    })
  })

  describe('multiple time strings in one paragraph', () => {
    it('preserves both times in boundary burst example', async () => {
      const input =
        'A client can make 95 requests at 11:59:59 and 95 more at 12:00:01.'
      const output = await processToHtml(input)
      expect(output).toContain('11:59:59')
      expect(output).toContain('12:00:01')
      expect(output).not.toContain('<div></div>')
    })

    it('preserves two different H:MM times', async () => {
      const input = 'At 2:47 AM the alert fired. By 3:15 PM it was resolved.'
      const output = await processToHtml(input)
      expect(output).toContain('2:47 AM')
      expect(output).toContain('3:15 PM')
      expect(output).not.toContain('<div></div>')
    })
  })

  describe('non-time directives are unaffected', () => {
    it('does not interfere with alphabetic text directives', async () => {
      // A real text directive like :abbr[HTML] should not be touched
      const output = await processToHtml('Use the :abbr[HTML] standard.')
      // The directive node should still be present (not converted to text)
      expect(output).not.toContain(':abbr')
    })

    it('does not interfere with container directives', async () => {
      const input = ':::video{src="/videos/demo.mp4"}\nVideo caption\n:::'
      const output = await processToHtml(input)
      // Container directive should still be processed, not restored to text
      expect(output).not.toContain(':::video')
    })
  })

  describe('output HTML structure', () => {
    it('produces a clean paragraph without broken elements', async () => {
      const input =
        'A client can make 95 requests at 11:59:59 and 95 more at 12:00:01.'
      const output = await processToHtml(input)
      // Should be a single, unbroken paragraph
      expect(output).toBe(
        '<p>A client can make 95 requests at 11:59:59 and 95 more at 12:00:01.</p>'
      )
    })

    it('wraps surrounding text correctly', async () => {
      const output = await processToHtml(
        'At 2:47 AM, all inter-service communication fails.'
      )
      expect(output).toBe(
        '<p>At 2:47 AM, all inter-service communication fails.</p>'
      )
    })
  })
})
