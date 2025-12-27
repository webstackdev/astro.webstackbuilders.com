export type SearchHit = {
  title: string
  url: string
  snippet?: string
  score?: number
}

export interface SearchContent {
  fullContent?: string
  title?: string
  url?: string
  path?: string
  description?: string
  excerpt?: string
  summary?: string
  name?: string
}

export interface SearchMetadata {
  contentLength?: number
  crawledAt?: string
  path?: string
  url?: string
}

export type SearchDocument<TContent, TMetadata> = {
  id: string
  content: TContent
  metadata?: TMetadata
  score: number
}

export type SearchResult<TContent, TMetadata> = Array<SearchDocument<TContent, TMetadata>>

export type DefaultSearchResult = SearchResult<SearchContent, SearchMetadata>
