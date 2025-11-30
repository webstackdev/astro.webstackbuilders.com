/**
 * CTA requirements validation
 * Validates that pages meet CTA requirements based on their mode
 */

import { resolve } from 'path'
import type { AstroConfig } from 'astro'
import type {
  CallToActionComponent,
  WarningIssue,
  PageAnalysis,
  CallToActionMode,
} from '@integrations/CtaValidator/@types'
import {
  buildContentMapping,
  validateContentEntries,
  findContentPages,
  analyzePageCtas,
} from './contentValidator'

/**
 * Validate CTA requirements for content pages (Articles, Services, Case Studies)
 *
 * @param projectRoot - Absolute path to project root
 * @param _astroConfig - Astro configuration (unused, kept for API compatibility)
 * @param callToActionComponents - Discovered CTA components
 * @param logger - Astro logger instance
 * @param debug - Enable debug logging
 * @returns Array of warning issues found
 */
export async function validateCtaRequirements(
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
    validatePageCtaRequirements,
    logger,
    debug
  )

  // Also validate static index pages
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
 * Validate CTA requirements for a page
 *
 * @param analysis - Page analysis result
 * @param mode - CallToAction mode for the page
 * @returns Array of warning issues
 */
export function validatePageCtaRequirements(
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
 *
 * @param suggestedMode - Suggested mode to use
 * @param context - Context for the hint
 * @returns Helpful hint message
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
