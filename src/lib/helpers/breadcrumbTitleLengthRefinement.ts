import { z } from 'astro:content'
import { isProd } from '@lib/config/environmentServer'

const MAX_BREADCRUMB_TITLE_LENGTH = 55
const loggedBreadcrumbTitleWarnings = new Set<string>()

export const warnOnBreadcrumbTitleLength = (title: string, collectionName: string): void => {
  if (!isProd()) return
  if (title.length <= MAX_BREADCRUMB_TITLE_LENGTH) return

  const warningKey = `${collectionName}:${title}`
  if (loggedBreadcrumbTitleWarnings.has(warningKey)) return

  loggedBreadcrumbTitleWarnings.add(warningKey)
  console.warn(
    `[Breadcrumb Warning] ${collectionName} title "${title}" is ${title.length} characters long. Titles longer than ${MAX_BREADCRUMB_TITLE_LENGTH} characters will truncate in breadcrumbs.`
  )
}

/**
 * Wraps a collection schema with a refinement that enforces breadcrumb title length limits.
 * When a document provides a `title`, the wrapper invokes `warnOnBreadcrumbTitleLength`, which
 * emits a console warning in production builds if the title exceeds the global maximum so long
 * as the warning has not been logged previously for the same collection/title pair.
 *
 * @param schema Schema to guard with breadcrumb title validation
 * @param collectionName Name of the collection, used to scope warning messages
 * @returns Zod schema augmented with breadcrumb title length validation
 */
export const withBreadcrumbTitleWarning = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  collectionName: string
) =>
  schema.superRefine(data => {
    const candidateTitle = (data as { title?: string }).title
    if (typeof candidateTitle === 'string') {
      warnOnBreadcrumbTitleLength(candidateTitle, collectionName)
    }
  })
