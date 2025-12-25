import { randomUUID } from 'node:crypto'
import { and, db, eq, rateLimitWindows } from 'astro:db'

export type RateLimitWindowRecord = typeof rateLimitWindows.$inferSelect

export type RateLimitWindowResetInput = {
  hits: number
  limit: number
  windowMs: number
  windowExpiresAt: number
}

export type RateLimitWindowContext = {
  window: RateLimitWindowRecord | undefined
  resetWindow: (_input: RateLimitWindowResetInput) => Promise<RateLimitWindowRecord>
  incrementHits: () => Promise<RateLimitWindowRecord>
}

export async function withRateLimitWindow<T>(
  scope: string,
  identifier: string,
  handler: (_context: RateLimitWindowContext) => Promise<T>,
): Promise<T> {
  return db.transaction(async tx => {
    const result = await tx
      .select()
      .from(rateLimitWindows)
      .where(and(eq(rateLimitWindows.scope, scope), eq(rateLimitWindows.identifier, identifier)))
      .limit(1)

    let currentWindow = result[0]

    const resetWindow = async (input: RateLimitWindowResetInput): Promise<RateLimitWindowRecord> => {
      const upsertId = currentWindow?.id ?? randomUUID()
      const payload: RateLimitWindowRecord = {
        id: upsertId,
        scope,
        identifier,
        hits: input.hits,
        limit: input.limit,
        windowMs: input.windowMs,
        windowExpiresAt: input.windowExpiresAt,
        updatedAt: new Date(),
      }

      await tx
        .insert(rateLimitWindows)
        .values(payload)
        .onConflictDoUpdate({
          target: [rateLimitWindows.scope, rateLimitWindows.identifier],
          set: {
            hits: input.hits,
            limit: input.limit,
            windowMs: input.windowMs,
            windowExpiresAt: input.windowExpiresAt,
            updatedAt: payload.updatedAt,
          },
        })

      currentWindow = payload
      return payload
    }

    const incrementHits = async (): Promise<RateLimitWindowRecord> => {
      if (!currentWindow) {
        throw new Error('Rate limit window has not been initialized')
      }

      const nextHits = currentWindow.hits + 1
      const updatedAt = new Date()

      await tx
        .update(rateLimitWindows)
        .set({
          hits: nextHits,
          updatedAt,
        })
        .where(and(eq(rateLimitWindows.scope, scope), eq(rateLimitWindows.identifier, identifier)))

      currentWindow = {
        ...currentWindow,
        hits: nextHits,
        updatedAt,
      }

      return currentWindow
    }

    return handler({
      window: currentWindow,
      resetWindow,
      incrementHits,
    })
  })
}
