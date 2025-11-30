export interface WebmentionAuthor {
  url?: string
  name?: string
  photo?: string
}

export interface WebmentionContent {
  html?: string
  text?: string
  value?: string
}

export interface Webmention {
  'wm-id': string
  'wm-target': string
  'wm-property': string
  'wm-source'?: string
  published: string
  author?: WebmentionAuthor
  content?: WebmentionContent
  url?: string
}

export interface WebmentionResponse {
  type: string
  name: string
  children: Webmention[]
}
