/**
 * Highlighter Component
 *
 * Barrel export for shareable text highlights with social sharing.
 * Import the Astro component for MDX usage.
 *
 * @example
 * ```mdx
 * import { Highlighter } from '@components/Social/Highlighter'
 *
 * This is <Highlighter>shareable text</Highlighter>.
 * ```
 */

export { default as Highlighter } from './Highlighter.astro'
export { Highlighter as HighlighterScript } from './client'
export type { SharePlatform, ShareData } from '@components/Social/common'
