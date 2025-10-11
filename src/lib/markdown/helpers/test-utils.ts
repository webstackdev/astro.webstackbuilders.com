import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { remarkRehypeConfig } from '../../config/markdown.ts'

/**
 * Process markdown through a minimal pipeline with a single plugin (Layer 1)
 * No GFM, no Astro settings - just the plugin being tested
 */
export async function processIsolated(
  markdown: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<string> {
  const processor = remark()

  if (options !== undefined) {
    processor.use(plugin, options)
  } else {
    processor.use(plugin)
  }

  const result = await processor
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

/**
 * Process markdown through Astro's pipeline with a single plugin (Layer 2)
 * Includes GFM and Astro's remarkRehype settings
 */
export async function processWithAstroSettings(
  markdown: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<string> {
  const processor = remark()
    // Enable GFM (matches Astro's gfm: true)
    .use(remarkGfm)

  // Add the plugin being tested
  if (options !== undefined) {
    processor.use(plugin, options)
  } else {
    processor.use(plugin)
  }

  const result = await processor
    // Convert to rehype with Astro's configuration
    .use(remarkRehype, remarkRehypeConfig)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

/**
 * Process markdown through the complete Astro pipeline (Layer 3)
 * Includes all remark and rehype plugins in the correct order
 */
export async function processWithFullPipeline(markdown: string): Promise<string> {
  // Import all plugins
  const remarkAbbr = (await import('remark-abbr')).default
  const remarkAttr = (await import('remark-attr')).default
  const remarkAttribution = (await import('../remark-attribution/index.ts')).default
  const remarkBreaks = (await import('remark-breaks')).default
  const remarkEmoji = (await import('remark-emoji')).default
  const remarkLinkifyRegex = (await import('remark-linkify-regex')).default
  const remarkToc = (await import('remark-toc')).default
  const { rehypeAccessibleEmojis } = await import('rehype-accessible-emojis')
  const rehypeAutolinkHeadings = (await import('rehype-autolink-headings')).default
  const { rehypeTailwindClasses } = await import('../rehype-tailwind-classes.ts')

  // Import configurations
  const {
    remarkAttrConfig,
    remarkTocConfig,
    rehypeAutolinkHeadingsConfig,
  } = await import('../../config/markdown.ts')

  const processor = remark()
    // Enable GFM (matches gfm: true)
    .use(remarkGfm)

    // Add all remark plugins in the same order as Astro
    .use(remarkAbbr)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .use(remarkAttr, remarkAttrConfig as any)
    .use(remarkAttribution)
    .use(remarkBreaks)
    .use(remarkEmoji)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .use(remarkLinkifyRegex as any, /^(https?:\/\/[^\s$.?#].[^\s]*)$/i)
    .use(remarkToc, remarkTocConfig)

    // Convert to rehype with Astro's options
    .use(remarkRehype, remarkRehypeConfig)

    // Add all rehype plugins in the same order as Astro
    .use(rehypeAccessibleEmojis)
    .use(rehypeAutolinkHeadings, rehypeAutolinkHeadingsConfig)
    .use(rehypeTailwindClasses)

    // Convert to HTML string
    .use(rehypeStringify)

  const result = await processor.process(markdown)
  return String(result)
}
