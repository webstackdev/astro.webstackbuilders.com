import type { DefaultSearchResult, SearchHit } from '@actions/search/@types'

const MIN_RELEVANCY_SCORE = 0.75

const getCanonicalResultPath = (url: string): string => {
  try {
    const parsedUrl = new URL(url, 'https://www.webstackbuilders.com')
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '') || '/'
    return normalizedPath
  } catch {
    const [withoutQuery] = url.split('?', 1)
    const [withoutFragment] = withoutQuery.split('#', 1)
    return withoutFragment.replace(/\/+$/, '') || '/'
  }
}

const getExcerpt = (value: unknown, maxLength = 200): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return undefined
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

export const mapUpstashSearchResults = (raw: unknown, fallbackQuery: string): SearchHit[] => {
  const results: DefaultSearchResult = (() => {
    if (Array.isArray(raw)) {
      return raw as DefaultSearchResult
    }

    if (raw && typeof raw === 'object' && 'results' in raw) {
      const value = (raw as { results?: unknown }).results
      return Array.isArray(value) ? (value as DefaultSearchResult) : []
    }

    return []
  })()

  const fallbackUrl = `/search?q=${encodeURIComponent(fallbackQuery)}`

  const hits = results
    .filter(item => typeof item.score === 'number' && item.score >= MIN_RELEVANCY_SCORE)
    .map((item): SearchHit | null => {
      const content = item.content ?? {}
      const metadata = item.metadata ?? {}

      const urlValue = (content['url'] ??
        content['path'] ??
        metadata['url'] ??
        metadata['path'] ??
        item.id) as unknown
      const candidateUrl = typeof urlValue === 'string' ? urlValue.trim() : ''
      const url =
        candidateUrl && (candidateUrl.startsWith('/') || candidateUrl.startsWith('http'))
          ? candidateUrl
          : fallbackUrl

      const titleValue = (content['title'] ?? content['name'] ?? item.id) as unknown
      const title = typeof titleValue === 'string' && titleValue.trim() ? titleValue : fallbackQuery

      const snippetValue = (content['description'] ??
        content['excerpt'] ??
        content['summary'] ??
        content['fullContent']) as unknown
      const snippet = getExcerpt(snippetValue)

      const hit: SearchHit = { title, url }
      if (snippet) {
        hit.snippet = snippet
      }
      if (typeof item.score === 'number') {
        hit.score = item.score
      }

      return hit
    })
    .filter((hit): hit is SearchHit => Boolean(hit))

  const dedupedHits = new Map<string, SearchHit>()

  for (const hit of hits) {
    const key = getCanonicalResultPath(hit.url)
    const existing = dedupedHits.get(key)

    if (!existing) {
      dedupedHits.set(key, hit)
      continue
    }

    if ((hit.score ?? 0) > (existing.score ?? 0)) {
      dedupedHits.set(key, hit)
    }
  }

  return Array.from(dedupedHits.values())
}
