import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkSmartypants from 'remark-smartypants'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import { remarkRehypeConfig } from '@lib/config/markdown'

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
  processor.use(remarkSmartypants)

  if (stage === 'remark') {
    if (pluginOptions !== undefined) {
      processor.use(plugin as never, pluginOptions as never)
    } else {
      processor.use(plugin as never)
    }
  }

  processor.use(remarkRehype, remarkRehypeConfig)
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
export async function processWithFullPipeline(markdown: string): Promise<string> {
  // Import all plugins - using our TypeScript versions (modern API)
  const remarkAbbreviations = (await import('../plugins/remark-abbreviations/index')).default
  const remarkAttributes = (await import('../plugins/remark-attributes/index')).default
  const remarkAttribution = (await import('../plugins/remark-attribution/index')).default
  const remarkBreaks = (await import('remark-breaks')).default
  const remarkEmoji = (await import('remark-emoji')).default
  const remarkLinkifyRegex = (await import('remark-linkify-regex')).default
  const { rehypeAccessibleEmojis } = await import('rehype-accessible-emojis')
  const rehypeAutolinkHeadings = (await import('rehype-autolink-headings')).default
  const { rehypeTailwindClasses } = await import('../plugins/rehype-tailwind')

  // Import configurations
  const { remarkAttributesConfig, rehypeAutolinkHeadingsConfig } = await import('../../config/markdown')

  try {
    const processor = remark()
      // Enable GFM (matches gfm: true)
      .use(remarkGfm)

      // Add all remark plugins in the same order as Astro
      .use(remarkAbbreviations)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .use(remarkAttributes, remarkAttributesConfig as any)
      .use(remarkAttribution)
      .use(remarkBreaks)
      .use(remarkEmoji)
      // remarkLinkifyRegex is a factory function - call it with the regex first
      .use(remarkLinkifyRegex(/^(https?:\/\/[^\s$.?#].[^\s]*)$/i))
      .use(remarkRehype, remarkRehypeConfig)

      // Add all rehype plugins in the same order as Astro
      .use(rehypeHeadingIds)
      .use(rehypeAccessibleEmojis)
      .use(rehypeAutolinkHeadings, rehypeAutolinkHeadingsConfig)
      .use(rehypeTailwindClasses)

      // Convert to HTML string
      .use(rehypeStringify)

    const result = await processor.process(markdown)
    return String(result)
  } catch (error) {
    console.error('ERROR in processWithFullPipeline:', error)
    throw error
  }
}
