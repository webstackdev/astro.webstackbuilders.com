/**
 * Format utility functions converted from Eleventy filters
 */

/**
 * Print high numbers as "11K" for thousands
 * Usage: humanizeNumber(likeCount)
 */
export function humanizeNumber(num: number): string {
  if (num > 999) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toString()
}

/**
 * Obfuscate email addresses
 * Usage: obfuscateEmail(author.email)
 */
export function obfuscateEmail(str: string): string {
  const chars: string[] = []
  for (let i = str.length - 1; i >= 0; i--) {
    chars.push(`&#${str.charCodeAt(i)};`)
  }
  return chars.join('')
}

/**
 * Sets or changes the extension on media files
 * Usage: setExtension(imgsrc, 'webp')
 */
export function setExtension(filePath: string, newExt: string): string {
  const lastDotIndex = filePath.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return `${filePath}.${newExt}`
  }
  return `${filePath.substring(0, lastDotIndex)}.${newExt}`
}

/**
 * Convert string to slug format
 * Usage: slugify("My String")
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Add non-breaking spaces to prevent awkward line breaks
 * Usage: addNbsp(pages.data.title)
 */
export function addNbsp(str: string): string {
  // Replace spaces before short words with non-breaking spaces
  return str.replace(/\s+(a|an|and|at|but|by|for|in|nor|of|on|or|so|the|to|up|yet)\s+/gi, ' $1&nbsp;')
}