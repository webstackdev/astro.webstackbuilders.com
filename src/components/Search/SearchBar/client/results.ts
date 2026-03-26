import { html, type TemplateResult } from 'lit'

const MIN_HIGHLIGHT_TERM_LENGTH = 2
const SEARCH_RESULT_FALLBACK_PATH = '/search'

type HighlightChunk = string | TemplateResult

interface HighlightSearchTextOptions {
  highlightClassName?: string
}

const getHighlightTerms = (query: string): string[] => {
  return [...new Set(query.trim().split(/\s+/).filter(term => term.length >= MIN_HIGHLIGHT_TERM_LENGTH))].sort(
    (left, right) => right.length - left.length
  )
}

const findNextHighlightMatch = (
  normalizedText: string,
  normalizedTerms: string[],
  startIndex: number
): { index: number; term: string } | null => {
  let nextMatch: { index: number; term: string } | null = null

  for (const term of normalizedTerms) {
    const index = normalizedText.indexOf(term, startIndex)

    if (index < 0) {
      continue
    }

    if (!nextMatch || index < nextMatch.index || (index === nextMatch.index && term.length > nextMatch.term.length)) {
      nextMatch = { index, term }
    }
  }

  return nextMatch
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

  const parts: HighlightChunk[] = []
  const normalizedText = text.toLocaleLowerCase()
  const normalizedTerms = highlightTerms.map(term => term.toLocaleLowerCase())
  let cursor = 0

  while (cursor < text.length) {
    const nextMatch = findNextHighlightMatch(normalizedText, normalizedTerms, cursor)

    if (!nextMatch) {
      break
    }

    if (nextMatch.index > cursor) {
      parts.push(text.slice(cursor, nextMatch.index))
    }

    const matchText = text.slice(nextMatch.index, nextMatch.index + nextMatch.term.length)

    parts.push(html`<mark class=${highlightClassName}>${matchText}</mark>`)
    cursor = nextMatch.index + matchText.length
  }

  if (parts.length === 0) {
    return text
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts
}