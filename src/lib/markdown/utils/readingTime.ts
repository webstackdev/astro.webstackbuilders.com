/**
 * Estimate reading time for Markdown/MDX content.
 *
 * This is intentionally lightweight (no external deps) and runs at build-time.
 * It strips common Markdown/MDX constructs (frontmatter, code blocks, tags, imports)
 * before counting words.
 */

const defaultWordsPerMinute = 200

export function getReadingTimeLabel(
  content: string,
  options?: {
    wordsPerMinute?: number
  }
): string | undefined {
  const wordsPerMinute = options?.wordsPerMinute ?? defaultWordsPerMinute
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute <= 0) return undefined

  const wordCount = countWords(stripMarkdownForReadingTime(content))
  if (wordCount <= 0) return undefined

  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  return `${minutes} min read`
}

function stripMarkdownForReadingTime(content: string): string {
  // Remove YAML frontmatter if present (defensive; Astro collection body usually excludes it).
  const withoutFrontmatter = content.replace(/^---\s*[\s\S]*?\s*---\s*/m, ' ')

  // Remove fenced code blocks.
  const withoutFences = withoutFrontmatter.replace(/```[\s\S]*?```/g, ' ')

  // Remove inline code.
  const withoutInlineCode = withoutFences.replace(/`[^`]*`/g, ' ')

  // Remove MDX/ESM imports/exports.
  const withoutImports = withoutInlineCode
    .replace(/^\s*import\s+[^;\n]+;?\s*$/gm, ' ')
    .replace(/^\s*export\s+[^;\n]+;?\s*$/gm, ' ')

  // Remove JSX/HTML tags.
  const withoutTags = withoutImports.replace(/<[^>]+>/g, ' ')

  // Collapse links/images to their visible text.
  const withoutImages = withoutTags.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  const withoutLinks = withoutImages.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')

  return withoutLinks
}

function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)
  return matches ? matches.length : 0
}
