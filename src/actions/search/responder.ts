import type { DefaultSearchResult, SearchHit } from '@actions/search/@types'

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

  return results
    .map((item): SearchHit | null => {
      const content = item.content ?? {}
      const metadata = item.metadata ?? {}

      const urlValue = (content['url'] ?? content['path'] ?? metadata['url'] ?? metadata['path'] ?? item.id) as unknown
      const candidateUrl = typeof urlValue === 'string' ? urlValue.trim() : ''
      const url = candidateUrl && (candidateUrl.startsWith('/') || candidateUrl.startsWith('http')) ? candidateUrl : fallbackUrl

      const titleValue = (content['title'] ?? content['name'] ?? item.id) as unknown
      const title = typeof titleValue === 'string' && titleValue.trim() ? titleValue : fallbackQuery

      const snippetValue = (content['description'] ?? content['excerpt'] ?? content['summary'] ?? content['fullContent']) as unknown
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
}
