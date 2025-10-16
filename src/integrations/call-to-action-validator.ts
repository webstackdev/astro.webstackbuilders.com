/**
 * Astro Integration: CallToAction Component Usage Validator
 *
 * Prevents multiple instances of CallToAction components on the same page during build time.
 * Automatically detects all CallToAction components and validates their usage across pages.
 *
 * Features:
 * - Auto-discovery of CallToAction components
 * - Build-time validation with detailed error messages
 * - Support for adding new components without configuration
 * - Comprehensive logging and debugging
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import { callToActionValidator } from './src/integrations/call-to-action-validator'
 *
 * export default defineConfig({
 *   integrations: [
 *     callToActionValidator({
 *       // Optional: customize component detection
 *       componentPath: 'src/components/CallToAction',
 *       // Optional: enable debug logging
 *       debug: false
 *     })
 *   ]
 * })
 * ```
 */

import type { AstroIntegration, AstroConfig } from 'astro'
import { readdir, readFile } from 'fs/promises'
import { join, resolve, relative } from 'path'
import { fileURLToPath } from 'url'

// Types
interface CallToActionValidatorOptions {
  /** Path to CallToAction components directory (relative to project root) */
  componentPath?: string
  /** Enable debug logging */
  debug?: boolean
  /** Additional component patterns to detect */
  additionalPatterns?: string[]
}

interface ComponentUsage {
  componentName: string
  filePath: string
  lineNumber: number
  content: string
}

interface PageValidationResult {
  pagePath: string
  errors: ValidationError[]
  componentUsages: ComponentUsage[]
}

interface ValidationError {
  componentName: string
  message: string
  locations: ComponentUsage[]
}

interface CallToActionComponent {
  name: string
  path: string
  importPatterns: string[]
}

/**
 * Default configuration for the CallToAction validator
 */
const DEFAULT_OPTIONS: Required<CallToActionValidatorOptions> = {
  componentPath: 'src/components/CallToAction',
  debug: false,
  additionalPatterns: []
}

/**
 * CallToAction Component Usage Validator Integration
 *
 * This integration scans all pages during build time and ensures that only one
 * instance of each CallToAction component appears per page.
 */
export function callToActionValidator(options: CallToActionValidatorOptions = {}): AstroIntegration {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let astroConfig: AstroConfig
  let projectRoot: string
  let callToActionComponents: CallToActionComponent[] = []

  return {
    name: 'call-to-action-validator',
    hooks: {
      'astro:config:setup': ({ config: cfg, logger }) => {
        astroConfig = cfg
        projectRoot = fileURLToPath(cfg.root)

        if (config.debug) {
          logger.info('CallToAction Validator: Integration initialized')
        }
      },

      'astro:config:done': async ({ logger }) => {
        try {
          // Discover CallToAction components
          callToActionComponents = await discoverCallToActionComponents(
            projectRoot,
            config.componentPath,
            logger,
            config.debug
          )

          if (config.debug) {
            logger.info(`CallToAction Validator: Discovered ${callToActionComponents.length} components: ${
              callToActionComponents.map(c => c.name).join(', ')
            }`)
          }
        } catch (error) {
          logger.error(`CallToAction Validator: Failed to discover components: ${error}`)
          throw error
        }
      },

      'astro:build:start': async ({ logger }) => {
        if (config.debug) {
          logger.info('CallToAction Validator: Starting build validation...')
        }

        try {
          // Validate all pages
          const validationResults = await validateAllPages(
            projectRoot,
            astroConfig,
            callToActionComponents,
            logger,
            config.debug
          )

          // Check for errors
          const pagesWithErrors = validationResults.filter(result => result.errors.length > 0)

          if (pagesWithErrors.length > 0) {
            // Log detailed error information
            logger.error('CallToAction Validator: Multiple component instances detected!')

            for (const pageResult of pagesWithErrors) {
              logger.error(`\nPage: ${pageResult.pagePath}`)

              for (const error of pageResult.errors) {
                logger.error(`  ❌ ${error.message}`)

                for (const location of error.locations) {
                  logger.error(`     └─ Line ${location.lineNumber}: ${location.content.trim()}`)
                }
              }
            }

            // Throw error to stop build
            throw new Error(`CallToAction validation failed: ${pagesWithErrors.length} page(s) have multiple component instances. See details above.`)
          }

          if (config.debug) {
            logger.info(`CallToAction Validator: Validation successful! Checked ${validationResults.length} pages.`)
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('CallToAction validation failed')) {
            throw error
          }
          logger.error(`CallToAction Validator: Validation error: ${error}`)
          throw new Error(`CallToAction validation failed: ${error}`)
        }
      }
    }
  }
}

/**
 * Discover all CallToAction components in the specified directory
 */
async function discoverCallToActionComponents(
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
            importPatterns
          })

          if (debug) {
            logger.info(`CallToAction Validator: Found component '${componentName}' with patterns: ${importPatterns.join(', ')}`)
          }
        } catch {
          // index.astro doesn't exist, skip this directory
          if (debug) {
            logger.warn(`CallToAction Validator: Skipping '${componentName}' - no index.astro found`)
          }
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to read CallToAction components directory '${fullComponentPath}': ${error}`)
  }

  return components
}

/**
 * Generate possible import patterns for a component
 */
function generateImportPatterns(componentName: string, basePath: string): string[] {
  const patterns = [
    // Direct import patterns
    `from '@components/CallToAction/${componentName}/index.astro'`,
    `from '@components/CallToAction/${componentName}'`,
    `from '${basePath}/${componentName}/index.astro'`,
    `from '${basePath}/${componentName}'`,

    // Relative import patterns
    `from '../CallToAction/${componentName}/index.astro'`,
    `from '../CallToAction/${componentName}'`,
    `from './CallToAction/${componentName}/index.astro'`,
    `from './CallToAction/${componentName}'`,

    // Component usage patterns (in templates)
    `<${componentName}`,
    `<${componentName}/>`,
    `<${componentName} `,
  ]

  return patterns
}

/**
 * Validate all pages in the project
 */
async function validateAllPages(
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
 */
async function getPageFiles(projectRoot: string, _astroConfig: AstroConfig, _debug: boolean): Promise<string[]> {
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
 */
async function collectFiles(dir: string, extensions: string[], files: string[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        await collectFiles(fullPath, extensions, files)
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory doesn't exist or can't be read, skip
  }
}

/**
 * Validate a single page file
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
    componentUsages: []
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
          locations: usages
        })
      }
    }
  } catch {
    // File read error - skip validation for this file
  }

  return result
}

/**
 * Find all usages of a component in a file
 */
function findComponentUsages(
  component: CallToActionComponent,
  _content: string,
  lines: string[],
  filePath: string
): ComponentUsage[] {
  const usages: ComponentUsage[] = []

  for (const pattern of component.importPatterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line && line.includes(pattern)) {
        usages.push({
          componentName: component.name,
          filePath,
          lineNumber: i + 1,
          content: line
        })
      }
    }
  }

  // Remove duplicate usages (same line number)
  const uniqueUsages = usages.reduce((acc, usage) => {
    const existing = acc.find(u => u.lineNumber === usage.lineNumber)
    if (!existing) {
      acc.push(usage)
    }
    return acc
  }, [] as ComponentUsage[])

  return uniqueUsages
}

// Export default for convenience
export default callToActionValidator