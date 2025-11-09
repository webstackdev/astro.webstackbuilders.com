import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { AstroIntegration } from 'astro'
import type { SitemapItem } from '@astrojs/sitemap'

// Accumulator for pages data
const pagesData: Record<string, string[] | true> = {}

/**
 * Configuration options for sitemap serialization
 */
export interface SitemapSerializeOptions {
  /** Array of paths to exclude from sitemap (e.g., 'downloads', '/articles/demo') */
  exclude?: string[]
}

/**
 * Create a sitemap serialization function with configuration
 *
 * @param options - Configuration options for serialization
 * @returns Serialization function for use with sitemap integration
 * @internal
 */
export function createSerializeFunction(
  options: SitemapSerializeOptions = {}
): (_item: SitemapItem) => SitemapItem | undefined {
  const { exclude = [] } = options

  return (item: SitemapItem): SitemapItem | undefined => {
    const urlObject = new URL(item.url)
    const pathParts = urlObject.pathname.split('/').filter(Boolean)
    const topLevelPath = pathParts[0] ?? ''
    const fullPath = pathParts.join('/')

    // Check if path should be excluded from sitemap
    let isExcluded = false
    for (const excludePath of exclude) {
      const normalizedExclude = excludePath.startsWith('/') ? excludePath.slice(1) : excludePath

      // Check for exact match of full path OR top-level directory match
      if (fullPath === normalizedExclude || topLevelPath === normalizedExclude) {
        isExcluded = true
        break
      }
    }

    // Only collect page data if not excluded
    if (!isExcluded && topLevelPath) {
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

    // Return undefined for excluded paths, otherwise return the item
    return isExcluded ? undefined : item
  }
}

/**
 * Transform pages data into array format for JSON serialization
 *
 * @param data - Pages data map
 * @returns Transformed array with strings for single pages and objects for multi-level pages
 * @internal
 */
export function transformPagesData(
  data: Record<string, string[] | true>
): (string | Record<string, string[]>)[] {
  const transformedData: (string | Record<string, string[]>)[] = []

  for (const [key, value] of Object.entries(data)) {
    if (value === true) {
      // Single-level page: add as string
      transformedData.push(key)
    } else {
      // Multi-level page: add as object
      transformedData.push({ [key]: value })
    }
  }

  return transformedData
}

/**
 * Serialize pages data to JSON string
 *
 * @param data - Pages data to serialize
 * @returns JSON string representation
 * @internal
 */
export function serializePagesData(data: Record<string, string[] | true>): string {
  const transformedData = transformPagesData(data)
  return JSON.stringify(transformedData, null, 2)
}

/**
 * Write the collected pages data to .cache/pages.json for e2e testing
 */
function writePagesJson(): void {
  const cacheDir = join(process.cwd(), '.cache')
  const pagesFile = join(cacheDir, 'pages.json')

  try {
    mkdirSync(cacheDir, { recursive: true })

    const jsonContent = serializePagesData(pagesData)
    writeFileSync(pagesFile, jsonContent, 'utf-8')
    console.log(`✅ Pages data written to ${pagesFile}`)
  } catch (error) {
    console.error('❌ Failed to write pages.json:', error)
  }
}

/**
 * Clear the pages data accumulator
 * @internal
 */
function clearPagesData(): void {
  // Clear all keys from the pagesData object
  for (const key in pagesData) {
    delete pagesData[key]
  }
}

/**
 * Integration to write pages.json after build for E2E testing
 *
 * Use this with the sitemap integration's serialize option:
 *
 * @example
 * ```ts
 * // astro.config.ts
 * import sitemap from '@astrojs/sitemap'
 * import { createSerializeFunction, pagesJsonWriter } from './src/integrations/sitemapSerialize'
 *
 * export default defineConfig({
 *   integrations: [
 *     sitemap({
 *       serialize: createSerializeFunction({
 *         exclude: ['downloads', 'social-shares']
 *       })
 *     }),
 *     pagesJsonWriter()
 *   ]
 * })
 * ```
 */
export function pagesJsonWriter(): AstroIntegration {
  return {
    name: 'pages-json-writer',
    hooks: {
      'astro:build:start': () => {
        // Clear any stale data from previous builds
        clearPagesData()
      },
      'astro:build:done': () => {
        // Write pages.json after build is complete
        writePagesJson()
      },
    },
  }
}
