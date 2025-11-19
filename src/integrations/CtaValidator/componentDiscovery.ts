/**
 * Component discovery for CallToAction validator
 * Discovers all CallToAction components in the specified directory
 */
import { readdir, readFile } from 'fs/promises'
import { join, resolve } from 'path'
import { BuildError } from '../../lib/errors/BuildError'
import type { CallToActionComponent } from './@types'
import { generateImportPatterns } from './parsers'

/**
 * Discover all CallToAction components in the specified directory
 *
 * @param projectRoot - Absolute path to project root
 * @param componentPath - Relative path to CallToAction components directory
 * @param logger - Astro logger instance
 * @param debug - Enable debug logging
 * @returns Array of discovered components
 */
export async function discoverCallToActionComponents(
  projectRoot: string,
  componentPath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any,
  debug: boolean
): Promise<CallToActionComponent[]> {
  const fullComponentPath = resolve(projectRoot, componentPath)
  const components: CallToActionComponent[] = []

  try {
    const entries = await readdir(fullComponentPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const componentName = entry.name
        const componentDir = join(fullComponentPath, componentName)

        // Check if index.astro exists
        try {
          const indexPath = join(componentDir, 'index.astro')
          await readFile(indexPath, 'utf-8')

          // Generate import patterns for this component
          const importPatterns = generateImportPatterns(componentName, componentPath)

          components.push({
            name: componentName,
            path: indexPath,
            importPatterns,
          })

          if (debug) {
            logger.info(
              `CallToAction Validator: Found component '${componentName}' with patterns: ${importPatterns.join(', ')}`
            )
          }
        } catch {
          // index.astro doesn't exist, skip this directory
          if (debug) {
            logger.warn(
              `CallToAction Validator: Skipping '${componentName}' - no index.astro found`
            )
          }
        }
      }
    }
  } catch (error) {
    throw new BuildError({
      message: `Failed to read CallToAction components directory '${fullComponentPath}': ${error}`
    })
  }

  return components
}
