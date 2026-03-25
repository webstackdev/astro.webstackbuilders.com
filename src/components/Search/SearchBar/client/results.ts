import { html, type TemplateResult } from 'lit'

const MIN_HIGHLIGHT_TERM_LENGTH = 2
const SEARCH_RESULT_FALLBACK_PATH = '/search'

type HighlightChunk = string | TemplateResult

interface HighlightSearchTextOptions {
  highlightClassName?: string
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getHighlightTerms = (query: string): string[] => {
  return [...new Set(query.trim().split(/\s+/).filter(term => term.length >= MIN_HIGHLIGHT_TERM_LENGTH))].sort(
    (left, right) => right.length - left.length
  )
}

export const getSearchResultDisplayPath = (url: string): string => {
  if (!url) {
    return SEARCH_RESULT_FALLBACK_PATH
  }

  if (url.startsWith('/')) {
    return url
  }

  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || SEARCH_RESULT_FALLBACK_PATH
  } catch {
    return SEARCH_RESULT_FALLBACK_PATH
  }
}

export const highlightSearchText = (
  text: string,
  query: string,
  options: HighlightSearchTextOptions = {}
): HighlightChunk[] | string => {
  const highlightTerms = getHighlightTerms(query)
  const { highlightClassName = 'bg-warning-inverse' } = options

  if (!text || highlightTerms.length === 0) {
    return text
  }

  const pattern = new RegExp(`(${highlightTerms.map(term => escapeRegExp(term)).join('|')})`, 'gi')
  const parts: HighlightChunk[] = []
  let cursor = 0

  for (const match of text.matchAll(pattern)) {
    const matchText = match[0]
    const matchIndex = match.index ?? -1

    if (!matchText || matchIndex < 0) {
      continue
    }

    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex))
    }

    parts.push(html`<mark class=${highlightClassName}>${matchText}</mark>`)
    cursor = matchIndex + matchText.length
  }

  if (parts.length === 0) {
    return text
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts
}