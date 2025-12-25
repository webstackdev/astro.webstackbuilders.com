import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import type { SearchHit } from './@types'
import { performSearch } from './domain'
import { mapUpstashSearchResults } from './responder'

const inputSchema = z.object({
  q: z.string().trim().min(2),
  limit: z.number().int().min(1).max(20).optional(),
})

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
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Search failed.',
        })
      }
    },
  }),
}
