import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { performSearch, type SearchHit } from './search'

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
        return {
          hits: await performSearch(input.q, input.limit ?? 8),
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
