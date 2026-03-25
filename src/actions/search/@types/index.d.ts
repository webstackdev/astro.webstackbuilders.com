export type SearchHit = {
  title: string
  url: string
  snippet?: string
  score?: number
}

export interface SearchContent {
  fullContent?: string
  title?: string
  description?: string
  url?: string
  path?: string
  excerpt?: string
  summary?: string
  name?: string
}

export interface SearchMetadata {
  path?: string
  collection?: string
  url?: string
  contentLength?: number
  crawledAt?: string
}

export type SearchDocument<TContent, TMetadata> = {
  id: string
  content: TContent
  metadata?: TMetadata
  score: number
}

export type SearchResult<TContent, TMetadata> = Array<SearchDocument<TContent, TMetadata>>

export type DefaultSearchResult = SearchResult<SearchContent, SearchMetadata>
