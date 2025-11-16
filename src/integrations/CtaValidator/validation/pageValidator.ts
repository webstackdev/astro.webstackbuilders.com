/**
 * Page validation for CallToAction validator
 * Validates that pages don't have duplicate CTA component instances
 */

import { readdir, readFile } from 'fs/promises'
import { join, resolve, relative } from 'path'
import type { AstroConfig } from 'astro'
import type { CallToActionComponent, PageValidationResult } from '@integrations/CtaValidator/@types'
/* eslint-disable-next-line no-restricted-imports */
import { findComponentUsages } from '../parsers'

/**
 * Validate all pages in the project
 *
 * @param projectRoot - Absolute path to project root
 * @param astroConfig - Astro configuration object
 * @param components - Discovered CallToAction components
 * @param logger - Astro logger instance
 * @param debug - Enable debug logging
 * @returns Array of validation results for each page
 */
export async function validateAllPages(
  projectRoot: string,
  astroConfig: AstroConfig,
  components: CallToActionComponent[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any,
  debug: boolean
): Promise<PageValidationResult[]> {
  const results: PageValidationResult[] = []

  // Get all page files to validate
  const pageFiles = await getPageFiles(projectRoot, astroConfig, debug)

  if (debug) {
    logger.info(`CallToAction Validator: Validating ${pageFiles.length} page files`)
  }

  for (const pageFile of pageFiles) {
    const result = await validatePageFile(pageFile, components, projectRoot, debug)
    results.push(result)
  }

  return results
}

/**
 * Get all page files that need validation
 *
 * @param projectRoot - Absolute path to project root
 * @param _astroConfig - Astro configuration (unused, kept for API compatibility)
 * @param _debug - Debug flag (unused, kept for API compatibility)
 * @returns Array of absolute paths to page files
 */
async function getPageFiles(
  projectRoot: string,
  _astroConfig: AstroConfig,
  _debug: boolean
): Promise<string[]> {
  const pageFiles: string[] = []

  // Check pages directory
  const pagesDir = resolve(projectRoot, 'src/pages')
  await collectFiles(pagesDir, ['.astro', '.md', '.mdx'], pageFiles)

  // Check content collections if they exist
  try {
    const contentDir = resolve(projectRoot, 'src/content')
    await collectFiles(contentDir, ['.md', '.mdx'], pageFiles)
  } catch {
    // Content directory doesn't exist, that's fine
  }

  return pageFiles
}

/**
 * Recursively collect files with specific extensions
 *
 * @param dir - Directory to search
 * @param extensions - File extensions to include
 * @param files - Array to accumulate file paths
 */
async function collectFiles(dir: string, extensions: string[], files: string[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        await collectFiles(fullPath, extensions, files)
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory doesn't exist or can't be read, skip
  }
}

/**
 * Validate a single page file
 *
 * @param filePath - Absolute path to the page file
 * @param components - CallToAction components to check for
 * @param projectRoot - Absolute path to project root
 * @param _debug - Debug flag (unused, kept for API compatibility)
 * @returns Validation result for the page
 */
async function validatePageFile(
  filePath: string,
  components: CallToActionComponent[],
  projectRoot: string,
  _debug: boolean
): Promise<PageValidationResult> {
  const relativePath = relative(projectRoot, filePath)
  const result: PageValidationResult = {
    pagePath: relativePath,
    errors: [],
    componentUsages: [],
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')

    // Check each component
    for (const component of components) {
      const usages = findComponentUsages(component, content, lines, filePath)
      result.componentUsages.push(...usages)

      // Validate usage count
      if (usages.length > 1) {
        result.errors.push({
          componentName: component.name,
          message: `Multiple instances of ${component.name} found (${usages.length} times). Only one instance per page is allowed.`,
          locations: usages,
        })
      }
    }
  } catch {
    // File read error - skip validation for this file
  }

  return result
}

/**
 * Recursively find all .astro files in a directory
 *
 * @param dir - Directory to search
 * @returns Array of absolute paths to .astro files
 */
export async function findAstroFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        const subFiles = await findAstroFiles(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile() && entry.name.endsWith('.astro')) {
        files.push(fullPath)
      }
    }

    return files
  } catch {
    return []
  }
}
