import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { SitemapItem } from '@astrojs/sitemap'

// Accumulator for pages data
const pagesData: Record<string, string[] | true> = {}

/**
 * Serialize function for sitemap that also collects page data and outputs it for e2e testing
 */
export function serializeSitemapItem(item: SitemapItem): SitemapItem | undefined {
  const urlObject = new URL(item.url)
  const pathParts = urlObject.pathname.split('/').filter(Boolean)
  const topLevelPath = pathParts[0] ?? ''

  // Collect page data
  if (topLevelPath) {
    if (pathParts.length === 1) {
      // Single-level page (e.g., /privacy)
      // Only mark as true if it doesn't already have an array of sub-pages
      if (!pagesData[topLevelPath]) {
        pagesData[topLevelPath] = true
      }
    } else {
      // Multi-level page (e.g., /articles/my-post)
      const slug = pathParts.slice(1).join('/')

      // Convert to array if it was marked as true (index page)
      if (pagesData[topLevelPath] === true) {
        pagesData[topLevelPath] = []
      } else if (!pagesData[topLevelPath]) {
        pagesData[topLevelPath] = []
      }

      // Add slug if it's an array
      if (Array.isArray(pagesData[topLevelPath])) {
        if (!pagesData[topLevelPath].includes(slug)) {
          pagesData[topLevelPath].push(slug)
        }
      }
    }
  }

  // Skip excluded paths from sitemap
  if (topLevelPath === 'downloads' || topLevelPath === 'social-shares') {
    return undefined
  }

  return item
}

/**
 * Write the collected pages data to .cache/pages.json for e2e testing
 */
export function writePagesJson(): void {
  const cacheDir = join(process.cwd(), '.cache')
  const pagesFile = join(cacheDir, 'pages.json')

  try {
    mkdirSync(cacheDir, { recursive: true })

    // Transform data into array format
    const transformedData: (string | Record<string, string[]>)[] = []
    for (const [key, value] of Object.entries(pagesData)) {
      if (value === true) {
        // Single-level page: add as string
        transformedData.push(key)
      } else {
        // Multi-level page: add as object
        transformedData.push({ [key]: value })
      }
    }

    writeFileSync(pagesFile, JSON.stringify(transformedData, null, 2), 'utf-8')
    console.log(`✅ Pages data written to ${pagesFile}`)
  } catch (error) {
    console.error('❌ Failed to write pages.json:', error)
  }
}