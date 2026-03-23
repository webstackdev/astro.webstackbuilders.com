import { addBreadcrumb, isInitialized, setContext, setTags } from '@sentry/astro'

type Primitive = string | number | boolean | null

type RenderContextValue = Primitive | Primitive[]

type RenderContextRecord = Record<string, unknown>

export interface ApplyRenderSentryContextOptions {
  contextName: string
  context: RenderContextRecord
  tags?: Record<string, string | number | boolean | undefined>
  breadcrumbMessage?: string
}

const toPrimitive = (value: unknown): Primitive | Primitive[] | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (value instanceof URL) {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map(item => toPrimitive(item))
      .flatMap(item => (Array.isArray(item) ? item : item !== undefined ? [item] : []))

    return normalized.length > 0 ? normalized : undefined
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const normalizeContext = (context: RenderContextRecord): Record<string, RenderContextValue> => {
  return Object.entries(context).reduce<Record<string, RenderContextValue>>((accumulator, [key, value]) => {
    const normalizedValue = toPrimitive(value)

    if (normalizedValue !== undefined) {
      accumulator[key] = normalizedValue
    }

    return accumulator
  }, {})
}

const normalizeTags = (
  tags?: Record<string, string | number | boolean | undefined>
): Record<string, string> => {
  if (!tags) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(tags)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  )
}

/**
 * Adds request-scoped render context to the active Sentry scope for SSR page debugging.
 */
export const applyRenderSentryContext = ({
  contextName,
  context,
  tags,
  breadcrumbMessage,
}: ApplyRenderSentryContextOptions): void => {
  if (!isInitialized()) {
    return
  }

  const normalizedContext = normalizeContext(context)
  const normalizedTags = normalizeTags(tags)

  if (Object.keys(normalizedTags).length > 0) {
    setTags(normalizedTags)
  }

  if (Object.keys(normalizedContext).length > 0) {
    setContext(contextName, normalizedContext)
  }

  addBreadcrumb({
    category: 'render',
    level: 'info',
    message: breadcrumbMessage ?? `render:${contextName}`,
    data: normalizedContext,
  })
}