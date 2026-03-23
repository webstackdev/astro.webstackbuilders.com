export interface WebmentionDisplayItem {
  authorName: string
  authorUrl: string
  avatarUrl: string
  contentHtml: string
  id: string
  published: string
  sourceUrl: string
}

export interface WebmentionsListResult {
  likesCount: number
  mentions: WebmentionDisplayItem[]
  repostsCount: number
}