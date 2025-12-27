/**
 * Path and slug extraction utilities for CallToAction validator
 */

import type { ValidatedContentType, CallToActionComponent } from '@integrations/CtaValidator/@types'

/**
 * Determine content type from file path
 *
 * @param pagePath - Path to the page file
 * @returns Content type or null if not a validated content type
 */
export function getContentTypeFromPath(pagePath: string): ValidatedContentType | null {
  if (pagePath.includes('/articles/')) return 'articles'
  if (pagePath.includes('/services/')) return 'services'
  if (pagePath.includes('/case-studies/')) return 'case-studies'
  return null
}

/**
 * Get the first component (primary) alphabetically
 *
 * @param components - Array of CallToAction components
 * @returns Name of the first component alphabetically
 */
export function getFirstComponent(components: CallToActionComponent[]): string {
  return components.map(c => c.name).sort()[0] || ''
}

/**
 * Extract slug, collection name, and determine if page is dynamic from file path
 *
 * @param pagePath - Path to the page file
 * @param contentType - Content type of the page
 * @returns Object with slug, collection name, and dynamic route flag
 */
export function extractSlugAndCollection(
  pagePath: string,
  contentType: ValidatedContentType | null
): {
  slug?: string
  collectionName?: string
  isDynamicRoute?: boolean
} {
  if (!contentType) {
    return {}
  }

  const isDynamicRoute = pagePath.includes('[') && pagePath.includes(']')

  // Handle dynamic routes like [slug].astro or [...slug].astro
  if (isDynamicRoute) {
    // For dynamic routes, we can't extract the actual slug from the file path
    // Return the content type as collection name
    return {
      collectionName: contentType,
      isDynamicRoute: true,
    }
  }

  // For static routes, try to extract the actual slug
  const pathParts = pagePath.split('/')
  const fileName = pathParts[pathParts.length - 1]

  if (!fileName) {
    return {
      collectionName: contentType,
      isDynamicRoute: false,
    }
  }

  // Remove .astro extension and handle index files
  let slug = fileName.replace(/\.astro$/, '')
  if (slug === 'index') {
    // For index files, use "index" as identifier
    slug = 'index'
  }

  return {
    slug,
    collectionName: contentType,
    isDynamicRoute: false,
  }
}
