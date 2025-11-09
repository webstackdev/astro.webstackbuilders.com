/**
 * Frontmatter parsing utilities for CallToAction validator
 */

import type { PageFrontmatter, CallToActionMode } from '@integrations/CtaValidator/@types'

/**
 * Parse frontmatter from content
 *
 * @param content - File content with frontmatter
 * @returns Parsed frontmatter object
 */
export function parseFrontmatter(content: string): PageFrontmatter {
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
