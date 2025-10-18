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

/** Valid values for callToActionMode frontmatter option */
type CallToActionMode = 'none' | 'primary-only' | 'default' | 'many'

/** Content types that require CTA validation */
type ValidatedContentType = 'articles' | 'services' | 'case-studies'

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

interface WarningIssue {
  type: 'missing-primary' | 'missing-secondary'
  message: string
  pagePath: string
}

interface PageFrontmatter {
  callToActionMode?: CallToActionMode
}

interface PageAnalysis {
  path: string
  contentType: ValidatedContentType | null
  frontmatter: PageFrontmatter
  hasPrimaryCta: boolean
  hasSecondaryCta: boolean
  ctaComponents: string[]
  slug?: string | undefined
  collectionName?: string | undefined
  isDynamicRoute?: boolean | undefined
  contentFilePath?: string | undefined
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
  additionalPatterns: [],
}

/**
 * CallToAction Component Usage Validator Integration
 *
 * This integration scans all pages during build time and ensures that only one
 * instance of each CallToAction component appears per page.
 */
export function callToActionValidator(
  options: CallToActionValidatorOptions = {}
): AstroIntegration {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let astroConfig: AstroConfig
  let projectRoot: string
  let callToActionComponents: CallToActionComponent[] = []
  let commandName: string | undefined

  return {
    name: 'call-to-action-validator',
    hooks: {
      'astro:config:setup': ({ config: cfg, logger, command }) => {
        astroConfig = cfg
        projectRoot = fileURLToPath(cfg.root)
        commandName = command

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

          // Only log discovery messages during build commands, not during sync
          if (config.debug && commandName !== 'sync') {
            logger.info(
              `CallToAction Validator: Discovered ${callToActionComponents.length} components: ${callToActionComponents
                .map(c => c.name)
                .join(', ')}`
            )
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

          // Check CTA requirements for content pages
          const ctaWarnings = await validateCtaRequirements(
            projectRoot,
            astroConfig,
            callToActionComponents,
            logger,
            config.debug
          )

          // Log summary of CTA warnings
          if (ctaWarnings.length > 0) {
            logger.warn(
              `CallToAction Validator: Found ${ctaWarnings.length} CTA requirement warning(s)`
            )
          } else if (config.debug) {
            logger.info('CallToAction Validator: All content pages have proper CTA setup')
          }

          // Check for errors
          const pagesWithErrors = validationResults.filter(result => result.errors.length > 0)

          if (pagesWithErrors.length > 0) {
            // Log detailed error information
            logger.error('🚫 CallToAction Validator: Multiple component instances detected!')
            logger.error('')

            for (const pageResult of pagesWithErrors) {
              const relativePath = pageResult.pagePath.replace(projectRoot, '').replace(/^\//, '')
              logger.error(`📄 Page: ${relativePath}`)

              for (const error of pageResult.errors) {
                logger.error(`   ❌ ${error.message}`)

                for (const location of error.locations) {
                  logger.error(`      └─ Line ${location.lineNumber}: ${location.content.trim()}`)
                }
              }
              logger.error('')
            }

            // Use Astro's standard error approach for build failures
            const errorMessage = `CallToAction validation failed: Found multiple component instances on ${pagesWithErrors.length} page(s). Each CallToAction component should only appear once per page.`
            logger.error(
              `💡 Fix: Remove duplicate component instances or use different CallToAction component types.`
            )
            logger.error('')

            throw new Error(errorMessage)
          }

          if (config.debug) {
            logger.info(
              `CallToAction Validator: Validation successful! Checked ${validationResults.length} pages.`
            )
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('CallToAction validation failed')) {
            throw error
          }
          logger.error(`CallToAction Validator: Validation error: ${error}`)
          throw new Error(`CallToAction validation failed: ${error}`)
        }
      },
    },
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
    throw new Error(
      `Failed to read CallToAction components directory '${fullComponentPath}': ${error}`
    )
  }

  return components
}

/**
 * Generate possible import patterns for a component
 */
/**
 * Generate usage patterns for a CallToAction component (only component tags, not imports)
 */
function generateImportPatterns(componentName: string, _basePath: string): string[] {
  const patterns = [
    // Component usage patterns only - NOT import statements
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
          content: line,
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

/**
 * Get content collection entries and create a mapping for dynamic route resolution
 */
async function buildContentMapping(projectRoot: string): Promise<Map<string, string[]>> {
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
              const mdFile = entryFiles.find(file => file.isFile() && file.name.endsWith('.md'))
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
 */
async function validateContentEntries(
  pagesDir: string,
  callToActionComponents: CallToActionComponent[],
  contentMapping: Map<string, string[]>,
  warnings: WarningIssue[],
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
        const entryWarnings = validatePageCtaRequirements(analysis, mode)

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
      file => (file.includes('[slug]') || file.includes('[...slug]')) && file.endsWith('.astro')
    )

    return dynamicRoutes.length > 0 ? dynamicRoutes[0] || null : null
  } catch {
    return null
  }
}

/**
 * Analyze a specific content entry with its dynamic route template
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
 * Validate CTA requirements for content pages (Articles, Services, Case Studies)
 */
async function validateCtaRequirements(
  projectRoot: string,
  _astroConfig: AstroConfig,
  callToActionComponents: CallToActionComponent[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any,
  debug: boolean
): Promise<WarningIssue[]> {
  const warnings: WarningIssue[] = []
  const pagesDir = resolve(projectRoot, 'src', 'pages')

  // Build content mapping for dynamic route resolution
  const contentMapping = await buildContentMapping(projectRoot)

  // Find dynamic route templates and static pages
  const contentPages = await findContentPages(pagesDir, debug, logger)

  // Validate each content entry against its dynamic route template
  await validateContentEntries(
    pagesDir,
    callToActionComponents,
    contentMapping,
    warnings,
    logger,
    debug
  ) // Also validate static index pages
  for (const pagePath of contentPages) {
    // Only process index pages (static pages), skip dynamic routes here
    if (!pagePath.includes('[') || !pagePath.includes(']')) {
      const analysis = await analyzePageCtas(pagePath, callToActionComponents, debug, logger)

      // Skip validation based on frontmatter setting
      if (analysis.frontmatter.callToActionMode === 'none') {
        continue
      }

      const mode = analysis.frontmatter.callToActionMode || 'default'
      const pageWarnings = validatePageCtaRequirements(analysis, mode)

      // Add to warnings array and log them
      warnings.push(...pageWarnings)

      for (const warning of pageWarnings) {
        logger.warn(`⚠️  ${warning.message}`)
      }
    }
  }

  return warnings
}

/**
 * Recursively find all .astro files in a directory
 */
async function findAstroFiles(dir: string): Promise<string[]> {
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

/**
 * Find pages that require CTA validation (Articles, Services, Case Studies)
 */
async function findContentPages(
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
 */
async function analyzePageCtas(
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

      // First component alphabetically is considered primary
      if (!hasPrimaryCta && component.name === getFirstComponent(callToActionComponents)) {
        hasPrimaryCta = true
      } else if (hasPrimaryCta && !hasSecondaryCta) {
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

/**
 * Parse frontmatter from content
 */
function parseFrontmatter(content: string): PageFrontmatter {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    return {}
  }

  const frontmatterText = frontmatterMatch[1]
  if (!frontmatterText) {
    return {}
  }

  const callToActionModeMatch = frontmatterText.match(
    /callToActionMode:\s*["']?(none|primary-only|default|many)["']?/
  )

  const result: PageFrontmatter = {}
  if (callToActionModeMatch) {
    result.callToActionMode = callToActionModeMatch[1] as CallToActionMode
  }

  return result
}

/**
 * Determine content type from file path
 */
function getContentTypeFromPath(pagePath: string): ValidatedContentType | null {
  if (pagePath.includes('/articles/')) return 'articles'
  if (pagePath.includes('/services/')) return 'services'
  if (pagePath.includes('/case-studies/')) return 'case-studies'
  return null
}

/**
 * Get the first component (primary) alphabetically
 */
function getFirstComponent(components: CallToActionComponent[]): string {
  return components.map(c => c.name).sort()[0] || ''
}

/**
 * Extract slug, collection name, and determine if page is dynamic from file path
 */
function extractSlugAndCollection(
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

/**
 * Validate CTA requirements for a page
 */
function validatePageCtaRequirements(
  analysis: PageAnalysis,
  mode: CallToActionMode
): WarningIssue[] {
  const warnings: WarningIssue[] = []

  if (mode === 'none') {
    return warnings
  }

  // Generate enhanced page identifier with clickable content paths for dynamic routes
  let pageIdentifier: string
  if (analysis.isDynamicRoute && analysis.contentFilePath) {
    // For dynamic routes, show the specific content file path
    pageIdentifier = `${analysis.contentType} page: ${analysis.contentFilePath}`
  } else if (analysis.slug && analysis.slug !== 'index') {
    // Static route with specific slug
    pageIdentifier = `${analysis.contentType}/${analysis.slug}`
  } else {
    // Static index page or no slug
    pageIdentifier = `${analysis.contentType} ${analysis.slug === 'index' ? 'index' : ''} page`
  }

  const ctaCount = analysis.ctaComponents.length

  // Check primary CTA requirement
  if (!analysis.hasPrimaryCta) {
    const hint = getCtaModeHint('none', 'To quiet this warning')
    warnings.push({
      type: 'missing-primary',
      message: `Missing primary Call-to-Action component on ${pageIdentifier}. ${hint}`,
      pagePath: analysis.path,
    })
  }

  // Check requirements based on mode
  if (mode === 'default' && analysis.hasPrimaryCta && !analysis.hasSecondaryCta) {
    const hint = getCtaModeHint('primary-only', 'If only one CTA is desired')
    warnings.push({
      type: 'missing-secondary',
      message: `Missing secondary Call-to-Action component on ${pageIdentifier}. ${hint}`,
      pagePath: analysis.path,
    })
  }

  // Check "many" mode requirement (3+ CTAs)
  if (mode === 'many' && ctaCount < 3) {
    const hint = getCtaModeHint('default', 'If fewer CTAs are acceptable')
    warnings.push({
      type: 'missing-secondary',
      message: `Mode "many" requires 3+ Call-to-Action components on ${pageIdentifier} (found ${ctaCount}). ${hint}`,
      pagePath: analysis.path,
    })
  }

  return warnings
}

/**
 * Generate helpful hints for different CTA mode options
 */
function getCtaModeHint(suggestedMode: CallToActionMode, context: string): string {
  const baseMessage = `${context}, add \`callToActionMode: "${suggestedMode}"\` to the page's frontmatter`

  switch (suggestedMode) {
    case 'none':
      return baseMessage
    case 'primary-only':
      return baseMessage
    case 'default':
      return baseMessage
    case 'many':
      return `${context}, add \`callToActionMode: "many"\` to the page's frontmatter (requires 3+ CTAs)`
    default:
      return baseMessage
  }
}

// Export default for convenience
export default callToActionValidator
