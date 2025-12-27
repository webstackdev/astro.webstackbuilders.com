import { Search } from '@upstash/search'
import { getUpstashUrl, getUpstashPublicToken } from '@actions/utils/environment/environmentActions'
import { handleActionsFunctionError } from '@actions/utils/errors'
import type { SearchContent, SearchMetadata, SearchResult } from './@types'

const getQueryPreview = (query: string): { length: number; preview: string } => {
  const normalized = query.replace(/\s+/g, ' ').trim()
  const maxPreviewLength = 40
  const preview =
    normalized.length > maxPreviewLength ? `${normalized.slice(0, maxPreviewLength)}…` : normalized
  return { length: normalized.length, preview }
}

const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause:
        cause instanceof Error
          ? { name: cause.name, message: cause.message, stack: cause.stack }
          : cause,
    }
  }
  return {
    value: error,
  }
}

export const performSearch = async (
  q: string,
  limit = 8
): Promise<SearchResult<SearchContent, SearchMetadata>> => {
  const startedAt = Date.now()
  const queryPreview = getQueryPreview(q)
  const limitValue = typeof limit === 'number' && Number.isFinite(limit) ? limit : 8
  const url = getUpstashUrl()
  const token = getUpstashPublicToken()

  try {
    const client = new Search({ url, token })
    const response = await client.index('default').search({ query: q, limit: limitValue })
    return response
  } catch (error) {
    const details = {
      durationMs: Date.now() - startedAt,
      queryLength: queryPreview.length,
      queryPreview: queryPreview.preview,
      limit: limitValue,
      env: {
        hasUrl: Boolean(url),
        hasToken: Boolean(token),
      },
      error: serializeError(error),
    }

    const wrapped = handleActionsFunctionError(error, {
      route: 'actions:search',
      operation: 'performSearch',
      extra: details,
    })
    wrapped.details = details

    throw wrapped
  }
}
