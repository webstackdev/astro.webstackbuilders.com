/**
 * TypeScript type definitions for CallToAction Validator integration
 */

/** Options for configuring the CallToAction validator */
export interface CallToActionValidatorOptions {
  /** Path to CallToAction components directory (relative to project root) */
  componentPath?: string
  /** Enable debug logging */
  debug?: boolean
  /** Additional component patterns to detect */
  additionalPatterns?: string[]
}

/** Valid values for callToActionMode frontmatter option */
export type CallToActionMode = 'none' | 'primary-only' | 'default' | 'many'

/** Content types that require CTA validation */
export type ValidatedContentType = 'articles' | 'services' | 'case-studies'

/** Represents a single usage of a component in a file */
export interface ComponentUsage {
  componentName: string
  filePath: string
  lineNumber: number
  content: string
}

/** Result of validating a single page */
export interface PageValidationResult {
  pagePath: string
  errors: ValidationError[]
  componentUsages: ComponentUsage[]
}

/** Validation error with locations */
export interface ValidationError {
  componentName: string
  message: string
  locations: ComponentUsage[]
}

/** Warning issue for CTA requirements */
export interface WarningIssue {
  type: 'missing-primary' | 'missing-secondary'
  message: string
  pagePath: string
}

/** Page frontmatter configuration */
export interface PageFrontmatter {
  callToActionMode?: CallToActionMode
}

/** Analysis result for a page's CTA setup */
export interface PageAnalysis {
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

/** Discovered CallToAction component information */
export interface CallToActionComponent {
  name: string
  path: string
  importPatterns: string[]
}

/** Default configuration for the CallToAction validator */
export const DEFAULT_OPTIONS: Required<CallToActionValidatorOptions> = {
  componentPath: 'src/components/CallToAction',
  debug: false,
  additionalPatterns: [],
}
