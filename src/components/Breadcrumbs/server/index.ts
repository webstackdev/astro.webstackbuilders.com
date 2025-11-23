/**
 * Breadcrumb generation utilities
 */

export interface BreadcrumbItem {
  label: string
  href: string
  isCurrentPage: boolean
}

/**
 * Generate breadcrumb items from the current path
 * @param currentPath - The current URL path (e.g., '/articles/my-post')
 * @param currentPageTitle - Optional title override for the current page
 * @returns Array of breadcrumb items starting with Home
 * @example
 * ```typescript
 * generateBreadcrumbs('/articles/my-post', 'My Post Title')
 * // Returns:
 * // [
 * //   { label: 'Home', href: '/', isCurrentPage: false },
 * //   { label: 'Articles', href: '/articles', isCurrentPage: false },
 * //   { label: 'My Post Title', href: '/articles/my-post', isCurrentPage: true }
 * // ]
 * ```
 */
export function generateBreadcrumbs(
  currentPath: string,
  currentPageTitle?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = []

  // Always start with Home
  breadcrumbs.push({
    label: 'Home',
    href: '/',
    isCurrentPage: false,
  })

  // Clean up the path and split into segments
  const cleanPath = currentPath.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
  if (!cleanPath) return breadcrumbs // If empty after cleanup, just return Home

  const segments = cleanPath.split('/').filter(segment => segment !== '')

  // Build breadcrumbs for each segment
  let accumulatedPath = ''
  segments.forEach((segment, index) => {
    accumulatedPath += '/' + segment
    const isLast = index === segments.length - 1

    // Generate human-readable labels for common paths
    const label = generateBreadcrumbLabel(
      segment,
      accumulatedPath,
      isLast ? currentPageTitle : undefined
    )

    breadcrumbs.push({
      label,
      href: accumulatedPath,
      isCurrentPage: isLast,
    })
  })

  return breadcrumbs
}

/**
 * Generate human-readable labels for breadcrumb segments
 * @param segment - The URL segment (e.g., 'my-article')
 * @param fullPath - The accumulated path up to this point (e.g., '/articles/my-article')
 * @param pageTitle - Optional specific title for this segment
 * @returns Human-readable label for the breadcrumb
 * @example
 * ```typescript
 * generateBreadcrumbLabel('my-article', '/articles/my-article', 'My Article Title')
 * // Returns: 'My Article Title'
 *
 * generateBreadcrumbLabel('about', '/about')
 * // Returns: 'About'
 *
 * generateBreadcrumbLabel('case-studies', '/case-studies')
 * // Returns: 'Case Studies'
 * ```
 */
export function generateBreadcrumbLabel(
  segment: string,
  fullPath: string,
  pageTitle?: string
): string {
  // If we have a specific page title for the current page, use it (including empty strings)
  if (pageTitle !== undefined) {
    return pageTitle
  }

  // Handle specific known paths
  const pathMappings: Record<string, string> = {
    '/about': 'About',
    '/services': 'Services',
    '/articles': 'Articles',
    '/case-studies': 'Case Studies',
    '/contact': 'Contact',
    '/privacy': 'Privacy Policy',
    '/consent': 'Consent Policy',
    '/tags': 'Tags',
  }

  if (pathMappings[fullPath]) {
    return pathMappings[fullPath]
  }

  // Convert segment to title case and handle common patterns
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
