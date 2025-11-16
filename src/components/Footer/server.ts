/**
 * Server-side utilities for Footer component
 * Functions used during build process in Astro frontmatter
 */
import parsePhoneNumber from 'libphonenumber-js'
import { ClientScriptError } from '@components/scripts/errors'

/**
 * Format a phone number in standard format
 *
 * @param phoneNumber A numeric phone number e.g. `+12133734253`
 * @returns The formatted phone number e.g. `(213) 373-4253`
 */
export const formatPhoneNumber = (phoneNumber: string) => {
  const parsedPhoneNumber = parsePhoneNumber(phoneNumber)
  if (!parsedPhoneNumber) {
    throw new ClientScriptError({
      message: `Trying to format invalid phone number: ${phoneNumber}`
    })
  }
  return parsedPhoneNumber.format('NATIONAL')
}
