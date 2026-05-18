import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { generateOpenGraphImage } from 'astro-og-canvas'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_utils/errors'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/social-card'

const resolveAvatarFilePath = (): string => {
  const candidateUrls = [
    // Vercel serverless output after build.
    new URL('../../static/assets/images/kevin-brown.webp', import.meta.url),
    // Local source path for dev and test runs.
    new URL('../../../../public/assets/images/kevin-brown.webp', import.meta.url),
    // Legacy source asset path kept as a final fallback.
    new URL('../../../assets/images/avatars/kevin-brown.webp', import.meta.url),
  ]

  for (const candidateUrl of candidateUrls) {
    const filePath = fileURLToPath(candidateUrl)
    if (existsSync(filePath)) {
      return filePath
    }
  }

  throw new Error('Social card avatar asset could not be resolved for the current runtime')
}

const AVATAR_FILE_PATH = resolveAvatarFilePath()
const DEFAULT_TITLE = 'Platform Engineering by Kevin Brown'
const DEFAULT_DESCRIPTION =
  'Platform engineer helping teams harden delivery, modernize cloud platforms, and improve developer experience.'

type CollectionKey = 'articles' | 'caseStudies' | 'services' | 'downloads'
type PaletteKey = 'articles' | 'case-studies' | 'services' | 'downloads' | 'default'

interface SocialCardEntry {
  slug: string
  title: string
  description?: string
  palette: PaletteKey
}

const collectionConfig = [
  { collection: 'articles', pathPrefix: 'articles', palette: 'articles' },
  { collection: 'caseStudies', pathPrefix: 'case-studies', palette: 'case-studies' },
  { collection: 'services', pathPrefix: 'services', palette: 'services' },
  { collection: 'downloads', pathPrefix: 'downloads', palette: 'downloads' },
] as const satisfies ReadonlyArray<{
  collection: CollectionKey
  pathPrefix: string
  palette: PaletteKey
}>

const gradientPalette: Record<PaletteKey, [number, number, number][]> = {
  articles: [
    [10, 37, 64],
    [59, 130, 246],
  ],
  'case-studies': [
    [47, 27, 70],
    [156, 163, 175],
  ],
  services: [
    [6, 95, 70],
    [45, 212, 191],
  ],
  downloads: [
    [30, 64, 175],
    [147, 197, 253],
  ],
  default: [
    [2, 6, 23],
    [15, 118, 110],
  ],
}

/** Normalize slug parameters to a consistent format */
const normalizeSlug = (value: string | null): string => {
  if (!value) return 'home'
  const trimmed = value.trim().replace(/^\/+/, '').replace(/\/$/, '')
  return trimmed || 'home'
}

const sanitizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}…`
}

const resolveText = (
  candidates: Array<string | null | undefined>,
  fallback: string,
  maxLength: number
): string => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const sanitized = sanitizeText(candidate)
      if (sanitized) {
        return truncateText(sanitized, maxLength)
      }
    }
  }
  return truncateText(fallback, maxLength)
}

const buildContentIndex = async (): Promise<Record<string, SocialCardEntry>> => {
  const collectionEntries = await Promise.all(
    collectionConfig.map(async config => {
      const entries = await getCollection(config.collection)
      return entries.map(entry => ({
        slug: `${config.pathPrefix}/${entry.id}`,
        title: entry.data.title,
        description: entry.data.description,
        palette: config.palette,
      }))
    })
  )

  return collectionEntries.flat().reduce<Record<string, SocialCardEntry>>((acc, entry) => {
    acc[entry.slug] = entry
    return acc
  }, {})
}

export const GET: APIRoute = async ({ request, clientAddress, cookies }) => {
  const { context: apiContext } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    clientAddress,
    cookies,
  })

  try {
    const url = new URL(request.url)
    const slug = normalizeSlug(url.searchParams.get('slug'))
    const titleOverride = url.searchParams.get('title')
    const descriptionOverride = url.searchParams.get('description')

    const contentIndex = await buildContentIndex()
    const matchedEntry = contentIndex[slug]

    const title = resolveText([matchedEntry?.title, titleOverride], DEFAULT_TITLE, 120)
    const description = resolveText(
      [matchedEntry?.description, descriptionOverride],
      DEFAULT_DESCRIPTION,
      200
    )

    const palette = matchedEntry?.palette ?? 'default'

    const imageBuffer = await generateOpenGraphImage({
      title,
      description,
      bgGradient: gradientPalette[palette],
      padding: 80,
      logo: {
        path: AVATAR_FILE_PATH,
        size: [140, 140],
      },
      font: {
        title: {
          size: 86,
          lineHeight: 96,
        },
        description: {
          size: 48,
          lineHeight: 58,
          color: [226, 232, 240],
        },
      },
      format: 'PNG',
    })

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return buildApiErrorResponse(handleApiFunctionError(error, apiContext), {
      fallbackMessage: 'Unable to generate social card',
    })
  }
}
