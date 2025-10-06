/**
 * Date utility functions converted from Eleventy filters
 */

/**
 * Convert date to ISO format
 * Usage: toISODate(article.date)
 */
export function toISODate(date: Date): string {
  return date.toISOString()
}

/**
 * Format date with custom format
 * Usage: formatDate(build.timestamp, 'yyyy')
 */
export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Simple format replacements - can be extended
  return format
    .replace('yyyy', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('dd', day.toString().padStart(2, '0'))
}

/**
 * Convert date to readable format
 * Usage: readableDate(date, 'dd LLL yyyy')
 */
export function readableDate(date: Date, format?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  if (format) {
    // Custom format handling can be added here
    if (format.includes('LLL')) {
      options.month = 'short'
    }
  }

  return date.toLocaleDateString('en-US', options)
}

/**
 * Convert date from ISO string
 * Usage: dateFromISO(webmention.published)
 */
export function dateFromISO(isoString: string): Date {
  return new Date(isoString)
}