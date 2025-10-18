/**
 * Hero Content Column - Default Variant
 */
export interface ContentProps {
  /** Small text above the main title */
  pretitle?: string
  /** Main heading text */
  title?: string
  /** List of benefits to display */
  benefits?: Array<{
    text: string
    highlight: string
  }>
  /** Primary call-to-action link */
  primaryLink?: {
    href: string
    text: string
  }
  /** Secondary call-to-action link */
  secondaryLink?: {
    href: string
    text: string
  }
}

/**
 * Hero Content Column - Home Variant
 */
export interface HomeContentProps {
  /** Small text above the main title */
  pretitle: string
  /** List of benefits to display */
  benefits: Array<{
    text: string
    highlight: string
  }>
  /** Primary call-to-action link */
  primaryLink: {
    href: string
    text: string
  }
  /** Secondary call-to-action link */
  secondaryLink: {
    href: string
    text: string
  }
}
