import { BuildError } from '@lib/errors/BuildError'
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

    throw new BuildError(new Error('Content/Switcher: invalid path variant.', { cause: errorDetails }), {
      phase: 'compilation',
      filePath: 'src/components/Content/Switcher/server/index.ts',
      tool: 'content-switcher',
    })
  }

  return {
    currentVariant: candidateVariant,
    slug: slugParts.join('/'),
  }
}
