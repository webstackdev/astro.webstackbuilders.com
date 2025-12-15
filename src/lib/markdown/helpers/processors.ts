import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkSmartypants from '@lib/markdown/plugins/remark-smartypants'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import { markdownConfig } from '@lib/config/markdown'

export type ProcessStage = 'remark' | 'rehype'

export type ProcessParams<TPluginOptions = unknown> = {
  markdown: string
  /**
   * A Unified/remark/rehype plugin.
   * Kept intentionally permissive because ecosystem plugin typings vary
   * (different AST roots and option shapes).
   */
  plugin: unknown
  pluginOptions?: TPluginOptions
  stage?: ProcessStage
}

/**
 * Process markdown through a minimal pipeline with a single plugin (Layer 1)
 * No GFM, no Astro settings - just the plugin being tested
 */
export async function processIsolated(
  params: ProcessParams & { slugify?: boolean }
): Promise<string> {
  const {
    markdown,
    plugin,
    pluginOptions,
    stage = 'remark',
    slugify = false,
  } = params

  const processor = remark()

  if (stage === 'remark') {
    if (pluginOptions !== undefined) {
      processor.use(plugin as never, pluginOptions as never)
    } else {
      processor.use(plugin as never)
    }
  }

  processor.use(remarkRehype)
  if (slugify) processor.use(rehypeHeadingIds)

  if (stage === 'rehype') {
    if (pluginOptions !== undefined) {
      processor.use(plugin as never, pluginOptions as never)
    } else {
      processor.use(plugin as never)
    }
  }

  const result = await processor.use(rehypeStringify).process(markdown)

  return String(result)
}

/**
 * Process markdown through Astro's pipeline with a single plugin (Layer 2)
 * Includes GFM and Astro's remarkRehype settings
 */
export async function processWithAstroSettings(
  params: ProcessParams
): Promise<string> {
  const {
    markdown,
    plugin,
    pluginOptions,
    stage = 'remark',
  } = params

  const processor = remark()

  processor.use(remarkGfm)

  if (stage === 'remark') {
    if (pluginOptions !== undefined) {
      processor.use(plugin as never, pluginOptions as never)
    } else {
      processor.use(plugin as never)
    }
  }

  // Match our site markdownConfig ordering: run other remark plugins first,
  // then apply smartypants so it doesn't interfere with token-based replacements.
  processor.use(remarkSmartypants)

  processor.use(remarkRehype, markdownConfig.remarkRehype)
  processor.use(rehypeHeadingIds)

  if (stage === 'rehype') {
    if (pluginOptions !== undefined) {
      processor.use(plugin as never, pluginOptions as never)
    } else {
      processor.use(plugin as never)
    }
  }

  const result = await processor.use(rehypeStringify).process(markdown)

  return String(result)
}

/**
 * Process markdown through the complete Astro pipeline (Layer 3)
 * Includes all remark and rehype plugins in the correct order
 */
export async function processWithFullPipeline(content: string): Promise<string> {
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
