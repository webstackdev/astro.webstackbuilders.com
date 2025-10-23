/**
 * Extended Playwright test with site pages data
 *
 * Usage example:
 * ```typescript
 * import { test, expect } from '../helpers/baseTest'
 *
 * test('navigate to first article', async ({ page, articlePaths }) => {
 *   await page.goto(articlePaths[0])
 *   await expect(page).toHaveURL(/\/articles\//)
 * })
 *
 * test('check all tag pages exist', async ({ page, tagPaths }) => {
 *   for (const tagPath of tagPaths) {
 *     const response = await page.goto(tagPath)
 *     expect(response?.status()).toBe(200)
 *   }
 * })
 *
 * test('navigate to specific case study', async ({ page, caseStudyPaths }) => {
 *   const enterprisePath = caseStudyPaths.find(p => p.includes('enterprise'))
 *   await page.goto(enterprisePath!)
 * })
 * ```
 */
import { test as baseTest, expect } from '@playwright/test'
import pagesData from '../../../.cache/pages.json' with { type: 'json' }

/**
 * Extract and normalize paths for a specific key from pages.json
 */
function extractPaths(key: string): string[] {
  for (const item of pagesData) {
    if (typeof item === 'object' && key in item) {
      const slugs = (item as Record<string, string[]>)[key]
      if (!slugs) return []
      return slugs.map((slug: string) => `/${key}/${slug}`)
    }
  }
  return []
}

/**
 * Extract all single-page paths from pages.json
 * Includes both standalone pages (about, contact) and list view pages for collections (articles, tags)
 */
function extractSinglePages(): string[] {
  const pages: string[] = []

  for (const item of pagesData) {
    if (typeof item === 'string') {
      // Standalone single pages like /about, /contact
      pages.push(`/${item}`)
    } else {
      // List view pages for collections like /articles, /tags
      for (const key of Object.keys(item)) {
        pages.push(`/${key}`)
      }
    }
  }

  return pages
}

// Pre-computed path arrays
export const _sitePaths = {
  articles: extractPaths('articles'),
  caseStudies: extractPaths('case-studies'),
  services: extractPaths('services'),
  tags: extractPaths('tags'),
  downloads: extractPaths('downloads'),
  socialShares: extractPaths('social-shares'),
  singlePages: extractSinglePages(),
}

export const sitePaths = {
  articles: extractPaths('articles'),
  caseStudies: extractPaths('case-studies'),
  services: extractPaths('services'),
  tags: extractPaths('tags'),
  downloads: extractPaths('downloads'),
  socialShares: extractPaths('social-shares'),
  singlePages: extractSinglePages(),
  allPages: [
    ..._sitePaths.articles,
    ..._sitePaths.caseStudies,
    ..._sitePaths.services,
    ..._sitePaths.tags,
    ..._sitePaths.downloads,
    ..._sitePaths.socialShares,
    ..._sitePaths.singlePages,
    '/non-existent-page',
  ],
}

/**
 * Extended test method with content collections available as context
 */
export const test = baseTest.extend<{
  articlePaths: string[]
  caseStudyPaths: string[]
  servicePaths: string[]
  tagPaths: string[]
  downloadPaths: string[]
  socialSharePaths: string[]
  singlePagePaths: string[]
  allPaths: string[]
}>({
  articlePaths: async ({}, use) => {
    await use(sitePaths.articles)
  },
  caseStudyPaths: async ({}, use) => {
    await use(sitePaths.caseStudies)
  },
  servicePaths: async ({}, use) => {
    await use(sitePaths.services)
  },
  tagPaths: async ({}, use) => {
    await use(sitePaths.tags)
  },
  downloadPaths: async ({}, use) => {
    await use(sitePaths.downloads)
  },
  socialSharePaths: async ({}, use) => {
    await use(sitePaths.socialShares)
  },
  singlePagePaths: async ({}, use) => {
    await use(sitePaths.singlePages)
  },
  allPaths: async ({}, use) => {
    const all = [
      ...sitePaths.articles,
      ...sitePaths.caseStudies,
      ...sitePaths.services,
      ...sitePaths.tags,
      ...sitePaths.downloads,
      ...sitePaths.socialShares,
      ...sitePaths.singlePages,
    ]
    await use(all)
  },
})

export { expect }
