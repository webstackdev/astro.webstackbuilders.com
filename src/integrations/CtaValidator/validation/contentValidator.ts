/**
 * Content collection validation for CallToAction validator
 * Validates CTA requirements for content collections (articles, services, case-studies)
 */

import { readdir, readFile } from 'fs/promises'
import { join, resolve } from 'path'
import type {
  CallToActionComponent,
  PageAnalysis,
  ValidatedContentType,
  WarningIssue,
  CallToActionMode,
} from '@integrations/CtaValidator/@types'
import { findAstroFiles } from './pageValidator'
/* eslint-disable-next-line no-restricted-imports */
import {
  extractSlugAndCollection,
  findComponentUsages,
  getContentTypeFromPath,
  parseFrontmatter,
} from '../parsers'

/**
 * Get content collection entries and create a mapping for dynamic route resolution
 *
 * @param projectRoot - Absolute path to project root
 * @returns Map of collection names to content file paths
 */
export async function buildContentMapping(projectRoot: string): Promise<Map<string, string[]>> {
  const contentDir = resolve(projectRoot, 'src', 'content')
  const contentMapping = new Map<string, string[]>()

  try {
    const collections = ['articles', 'services', 'case-studies']

    for (const collection of collections) {
      const collectionDir = resolve(contentDir, collection)
      try {
        const entries = await readdir(collectionDir, { withFileTypes: true })
        const contentFiles: string[] = []

        for (const entry of entries) {
          if (entry.isDirectory()) {
            // Handle directory-based content structure
            const entryDir = resolve(collectionDir, entry.name)
            try {
              const entryFiles = await readdir(entryDir, { withFileTypes: true })
              const mdFile = entryFiles.find((file) => file.isFile() && file.name.endsWith('.md'))
              if (mdFile) {
                const contentPath = `src/content/${collection}/${entry.name}/${mdFile.name}`
                contentFiles.push(contentPath)
              }
            } catch {
              // Directory might be empty or inaccessible
            }
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            // Handle direct .md files
            const contentPath = `src/content/${collection}/${entry.name}`
            contentFiles.push(contentPath)
          }
        }

        if (contentFiles.length > 0) {
          contentMapping.set(collection, contentFiles)
        }
      } catch {
        // Collection directory doesn't exist, skip
        continue
      }
    }
  } catch {
    // Content directory doesn't exist or other error, return empty mapping
  }

  return contentMapping
}

/**
 * Validate individual content entries against their dynamic route templates
 *
 * @param pagesDir - Absolute path to pages directory
 * @param callToActionComponents - Discovered CTA components
 * @param contentMapping - Map of content collections to file paths
 * @param warnings - Array to accumulate warnings
 * @param logger - Astro logger instance
 * @param debug - Enable debug logging
 */
export async function validateContentEntries(
  pagesDir: string,
  callToActionComponents: CallToActionComponent[],
  contentMapping: Map<string, string[]>,
  warnings: WarningIssue[],
  validatePageCtaRequirementsFn: (analysis: PageAnalysis, mode: CallToActionMode) => WarningIssue[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any,
  debug: boolean
): Promise<void> {
  const contentTypes: ValidatedContentType[] = ['articles', 'services', 'case-studies']

  for (const contentType of contentTypes) {
    try {
      // Find the dynamic route template for this content type
      const templatePath = await findDynamicRouteTemplate(pagesDir, contentType)
      if (!templatePath) {
        if (debug) {
          logger.info(`CallToAction Validator: No dynamic route template found for ${contentType}`)
        }
        continue
      }

      // Get all content entries for this type
      const contentEntries = contentMapping.get(contentType) || []

      for (const contentFilePath of contentEntries) {
        // Create analysis for this specific content entry + template combination
        const analysis = await analyzeContentEntry(
          templatePath,
          contentFilePath,
          contentType,
          callToActionComponents,
          debug,
          logger
        )

        // Skip validation based on content frontmatter
        if (analysis.frontmatter.callToActionMode === 'none') {
          continue
        }

        const mode = analysis.frontmatter.callToActionMode || 'default'
        const entryWarnings = validatePageCtaRequirementsFn(analysis, mode)

        warnings.push(...entryWarnings)

        for (const warning of entryWarnings) {
          logger.warn(`⚠️  ${warning.message}`)
        }
      }
    } catch (error) {
      if (debug) {
        logger.info(`CallToAction Validator: Error validating ${contentType} entries: ${error}`)
      }
    }
  }
}

/**
 * Find the dynamic route template for a content type
 *
 * @param pagesDir - Absolute path to pages directory
 * @param contentType - Content type to find template for
 * @returns Absolute path to template file, or null if not found
 */
async function findDynamicRouteTemplate(
  pagesDir: string,
  contentType: string
): Promise<string | null> {
  const contentTypeDir = join(pagesDir, contentType)

  try {
    const files = await findAstroFiles(contentTypeDir)

    // Look for dynamic route patterns
    const dynamicRoutes = files.filter(
      (file) =>
        (file.includes('[slug]') || file.includes('[...slug]')) && file.endsWith('.astro')
    )

    return dynamicRoutes.length > 0 ? dynamicRoutes[0] || null : null
  } catch {
    return null
  }
}

/**
 * Analyze a specific content entry with its dynamic route template
 *
 * @param templatePath - Absolute path to the template file
 * @param contentFilePath - Relative path to the content file
 * @param contentType - Type of content
 * @param callToActionComponents - CTA components to check for
 * @param debug - Enable debug logging
 * @param logger - Astro logger instance
 * @returns Page analysis result
 */
async function analyzeContentEntry(
  templatePath: string,
  contentFilePath: string,
  contentType: ValidatedContentType,
  callToActionComponents: CallToActionComponent[],
  debug: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any
): Promise<PageAnalysis> {
  // Read the template file to check for CTA components
  const templateContent = await readFile(templatePath, 'utf-8')

  // Read the content file to get frontmatter
  const contentContent = await readFile(contentFilePath, 'utf-8')

  // Parse frontmatter from the content file (this overrides template frontmatter)
  const contentFrontmatter = parseFrontmatter(contentContent)

  // Check for CTA components in the template
  const ctaComponents: string[] = []
  let hasPrimaryCta = false
  let hasSecondaryCta = false

  for (const component of callToActionComponents) {
    for (const pattern of component.importPatterns) {
      if (templateContent.includes(pattern)) {
        ctaComponents.push(component.name)

        // Determine if it's primary or secondary based on component name
        if (['Contact', 'Featured'].includes(component.name)) {
          hasPrimaryCta = true
        } else if (['Download', 'Newsletter'].includes(component.name)) {
          hasSecondaryCta = true
        }
        break
      }
    }
  }

  if (debug && ctaComponents.length > 0) {
    logger.info(
      `CallToAction Validator: Content ${contentFilePath} would have CTAs: ${ctaComponents.join(', ')}`
    )
  }

  // Extract slug from content file path
  const pathParts = contentFilePath.split('/')
  const fileName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'unknown'
  const slug = fileName.replace(/\.md$/, '')

  return {
    path: templatePath,
    contentType,
    frontmatter: contentFrontmatter,
    hasPrimaryCta,
    hasSecondaryCta,
    ctaComponents,
    slug,
    collectionName: contentType,
    isDynamicRoute: true,
    contentFilePath,
  }
}

/**
 * Find pages that require CTA validation (Articles, Services, Case Studies)
 *
 * @param pagesDir - Absolute path to pages directory
 * @param debug - Enable debug logging
 * @param logger - Astro logger instance
 * @returns Array of absolute paths to content pages
 */
export async function findContentPages(
  pagesDir: string,
  debug: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any
): Promise<string[]> {
  const contentPages: string[] = []
  const contentTypes: ValidatedContentType[] = ['articles', 'services', 'case-studies']

  for (const contentType of contentTypes) {
    try {
      const contentDir = join(pagesDir, contentType)
      const files = await findAstroFiles(contentDir)

      // Filter for item view pages (not index pages)
      const itemPages = files.filter(
        (file: string) => !file.endsWith('/index.astro') && file.includes(`/${contentType}/`)
      )

      contentPages.push(...itemPages)

      if (debug) {
        logger.info(`CallToAction Validator: Found ${itemPages.length} ${contentType} pages`)
      }
    } catch {
      // Directory might not exist, that's okay
      if (debug) {
        logger.info(`CallToAction Validator: No ${contentType} directory found`)
      }
    }
  }

  return contentPages
}

/**
 * Analyze a page to determine its CTA setup
 *
 * @param pagePath - Absolute path to the page file
 * @param callToActionComponents - CTA components to check for
 * @param debug - Enable debug logging
 * @param logger - Astro logger instance
 * @returns Page analysis result
 */
export async function analyzePageCtas(
  pagePath: string,
  callToActionComponents: CallToActionComponent[],
  debug: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any
): Promise<PageAnalysis> {
  const content = await readFile(pagePath, 'utf-8')
  const lines = content.split('\n')

  // Parse frontmatter
  const frontmatter = parseFrontmatter(content)

  // Determine content type
  const contentType = getContentTypeFromPath(pagePath)

  // Find CTA components in page
  const ctaComponents: string[] = []
  let hasPrimaryCta = false
  let hasSecondaryCta = false

  for (const component of callToActionComponents) {
    const usages = findComponentUsages(component, content, lines, pagePath)
    if (usages.length > 0) {
      ctaComponents.push(component.name)

      // Determine if it's primary or secondary based on component name
      if (['Contact', 'Featured'].includes(component.name)) {
        hasPrimaryCta = true
      } else if (['Download', 'Newsletter'].includes(component.name)) {
        hasSecondaryCta = true
      }
    }
  }

  if (debug && ctaComponents.length > 0) {
    logger.info(`CallToAction Validator: Page ${pagePath} has CTAs: ${ctaComponents.join(', ')}`)
  }

  // Extract slug, collection information, and route type
  const { slug, collectionName, isDynamicRoute } = extractSlugAndCollection(pagePath, contentType)

  // For dynamic routes, try to get actual content file paths from collection entries
  let contentFilePath: string | undefined
  if (isDynamicRoute && contentType) {
    // This will be populated when we have access to collection entries during validation
    contentFilePath = undefined
  }

  return {
    path: pagePath,
    contentType,
    frontmatter,
    hasPrimaryCta,
    hasSecondaryCta,
    ctaComponents,
    slug,
    collectionName,
    isDynamicRoute,
    contentFilePath,
  }
}
