import { getCollection } from 'astro:content'
import { BuildError } from '@lib/errors/BuildError'
import { isDev } from '@lib/config/environmentServer'
type ContentVariant = 'articles' | 'deep-dive'

export const parseContentPath = (path: string) => {
  const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '')
  const [variant, ...slugParts] = normalizedPath.split('/').filter(Boolean)
  const candidateVariant = variant ?? ''

  const isSupportedVariant = (value: string): value is ContentVariant => {
    return value === 'articles' || value === 'deep-dive'
  }

  if (!isSupportedVariant(candidateVariant)) {
    const errorDetails = {
      providedPath: path,
      normalizedPath,
      receivedVariant: variant ?? null,
      expectedVariants: ['articles', 'deep-dive'],
    }

    throw new BuildError(
      new Error('Content/Switcher: invalid path variant.', { cause: errorDetails }),
      {
        phase: 'compilation',
        filePath: 'src/components/Content/Switcher/server/index.ts',
        tool: 'content-switcher',
      }
    )
  }

  return {
    currentVariant: candidateVariant,
    slug: slugParts.join('/'),
  }
}

/**
 * Determines whether the alternate content variant route exists for the given
 * content path. Deep-dive pages are only generated for articles that ship a
 * `pdf.mdx` entry, so the switcher must not link to or prefetch variants that
 * would resolve to a 404. Draft filtering mirrors the article and deep-dive
 * page `getStaticPaths` queries.
 */
export const contentPathHasAlternateVariant = async (path: string): Promise<boolean> => {
  const { currentVariant, slug } = parseContentPath(path)

  if (!slug) {
    return false
  }

  /**
   * getCollection with an id filter is used instead of getEntry so missing
   * entries do not emit "not found" warnings during the build.
   */
  const alternateCollection = currentVariant === 'articles' ? 'deepDives' : 'articles'
  const alternateEntries = await getCollection(
    alternateCollection,
    ({ id, data }) => id === slug && (isDev() || data.isDraft !== true)
  )

  return alternateEntries.length > 0
}
