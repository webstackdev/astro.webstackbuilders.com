/**
 * Markdown Pipeline Processor for Testing
 *
 * This module provides a function to process markdown through the complete
 * production pipeline, used for E2E testing.
 *
 * The pipeline automatically uses the same plugins and configuration as production
 * by importing from the shared markdown config.
 */

import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import { markdownConfig } from '../../config/markdown'

/**
 * Renders markdown content through the complete Astro pipeline
 *
 * This function processes markdown using the same plugin chain as production,
 * making it suitable for end-to-end testing of markdown rendering.
 *
 * @param content - Raw markdown string to process
 * @returns Processed HTML string
 *
 * @example
 * ```ts
 * const markdown = "# Hello\n\nThis is **bold** text."
 * const html = await renderMarkdown(markdown)
 * // Returns: "<h1>Hello</h1><p>This is <strong>bold</strong> text.</p>"
 * ```
 */
export async function renderMarkdown(content: string): Promise<string> {
  // Start with remark processor (type inferred as each plugin is added)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let processor: any = remark()

  // Add remark plugins from markdownConfig in order. Entries may be
  // either plugin functions or [plugin, options] tuples.
  // Respect markdownConfig.gfm (Astro enables GFM when gfm: true)
  if (markdownConfig.gfm !== false) {
    processor = processor.use(remarkGfm)
  }

  if (markdownConfig.remarkPlugins) {
    for (const entry of markdownConfig.remarkPlugins) {
      if (Array.isArray(entry)) {
        // [plugin, options]
        processor = processor.use(entry[0], entry[1])
      } else {
        processor = processor.use(entry)
      }
    }
  }

  // Insert remarkRehype conversion using the configured options
  // (this mirrors Astro's pipeline ordering)
  processor = processor.use(remarkRehype, markdownConfig.remarkRehype)

  // rehypeSlug is added by Astro in the real pipeline before user rehype
  // plugins; include it here to mirror that behavior for tests.
  processor = processor.use(rehypeSlug)

  // Add rehype plugins from markdownConfig in order. Entries may be
  // either plugin functions or [plugin, options] tuples.
  if (markdownConfig.rehypePlugins) {
    for (const entry of markdownConfig.rehypePlugins) {
      if (Array.isArray(entry)) {
        processor = processor.use(entry[0], entry[1])
      } else {
        processor = processor.use(entry)
      }
    }
  }

  // Ensure output is stringified to HTML
  processor = processor.use(rehypeStringify)

  const result = await processor.process(content)
  return String(result)
}
