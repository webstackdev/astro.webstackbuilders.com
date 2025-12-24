export type SearchHit = {
  title: string
  url: string
  snippet?: string
  score?: number
}

export type UpstashSearchResult = {
  id?: string
  score?: number
  document?: Record<string, unknown>
  content?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
