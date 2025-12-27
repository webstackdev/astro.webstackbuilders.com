import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import type { SearchHit } from './@types'
import { performSearch } from './domain'
import { mapUpstashSearchResults } from './responder'
import { throwActionError } from '@actions/utils/errors'

const inputSchema = z.object({
  q: z.string().trim().min(2),
  limit: z.number().int().min(1).max(20).optional(),
})

export type SearchQueryInput = z.infer<typeof inputSchema>

export const search = {
  query: defineAction({
    accept: 'json',
    input: inputSchema,
    handler: async (input): Promise<{ hits: SearchHit[] }> => {
      try {
        const results = await performSearch(input.q, input.limit ?? 8)
        return {
          hits: mapUpstashSearchResults(results, input.q),
        }
      } catch (error) {
        throwActionError(
          error,
          { route: '/_actions/search/query', operation: 'query' },
          { fallbackMessage: 'Search failed.' }
        )
      }
    },
  }),
}
