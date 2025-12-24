import type { SearchHit, UpstashSearchResult } from '@actions/search/@types'

export const mapUpstashSearchResults = (raw: unknown, fallbackQuery: string): SearchHit[] => {
  const results: UpstashSearchResult[] = (() => {
    if (Array.isArray(raw)) {
      return raw as UpstashSearchResult[]
    }

    if (raw && typeof raw === 'object' && 'results' in raw) {
      const value = (raw as { results?: unknown }).results
      return Array.isArray(value) ? (value as UpstashSearchResult[]) : []
    }

    return []
  })()

  const fallbackUrl = `/search?q=${encodeURIComponent(fallbackQuery)}`

  return results
    .map((item): SearchHit | null => {
      const content = item.document ?? item.content ?? {}
      const metadata = item.metadata ?? {}

      const urlValue = (content['url'] ?? content['path'] ?? metadata['url'] ?? metadata['path'] ?? item.id) as unknown
      const candidateUrl = typeof urlValue === 'string' ? urlValue.trim() : ''
      const url = candidateUrl && (candidateUrl.startsWith('/') || candidateUrl.startsWith('http')) ? candidateUrl : fallbackUrl

      const titleValue = (content['title'] ?? content['name'] ?? item.id) as unknown
      const title = typeof titleValue === 'string' && titleValue.trim() ? titleValue : fallbackQuery

      const snippetValue = (content['description'] ?? content['excerpt'] ?? content['summary']) as unknown
      const snippet = typeof snippetValue === 'string' && snippetValue.trim() ? snippetValue : undefined

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
