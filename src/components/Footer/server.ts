/**
 * Server-side utilities for Footer component
 * Functions used during build process in Astro frontmatter
 */

import parsePhoneNumber from 'libphonenumber-js'

/**
 * Format a phone number in standard format
 *
 * @param phoneNumber A numeric phone number e.g. `+12133734253`
 * @returns The formatted phone number e.g. `(213) 373-4253`
 */
export const formatPhoneNumber = (phoneNumber: string) => {
  const parsedPhoneNumber = parsePhoneNumber(phoneNumber)
  if (!parsedPhoneNumber) {
    // throw new Error(`Trying to format invalid phone number: ${phoneNumber}`)
    return undefined
  }
  return parsedPhoneNumber.format('NATIONAL')
}
