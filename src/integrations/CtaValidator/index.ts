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
 * import { callToActionValidator } from './src/integrations/CtaValidator'
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
import { fileURLToPath } from 'url'
import { BuildError } from '../../lib/errors/BuildError'
import type { CallToActionValidatorOptions, CallToActionComponent } from './@types'
import { discoverCallToActionComponents } from './componentDiscovery'
import { validateAllPages, validateCtaRequirements } from './validation'

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

            logger.error(
              `💡 Fix: Remove duplicate component instances or use different CallToAction component types.`
            )
            logger.error('')

            throw new BuildError({
              message: `CallToAction validation failed: Found multiple component instances on ${pagesWithErrors.length} page(s). Each CallToAction component should only appear once per page.`
            })
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
          throw new BuildError({
            message: `CallToAction validation failed: ${error}`
          })
        }
      },
    },
  }
}

export default callToActionValidator
