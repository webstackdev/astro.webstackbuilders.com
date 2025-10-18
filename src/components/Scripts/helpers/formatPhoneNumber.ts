import parsePhoneNumber from 'libphonenumber-js'
import { log } from '@lib/logger'

/**
 * Format a phone number in standard format
 *
 * @param phoneNumber A numeric phone number e.g. `+12133734253`
 * @returns The formatted phone number e.g. `(213) 373-4253`
 */
export const formatPhoneNumber = (phoneNumber: string) => {
  const parsedPhoneNumber = parsePhoneNumber(phoneNumber)
  if (!parsedPhoneNumber) {
    log(`[5548] Trying to format invalid phone number: ${phoneNumber}`)
    return
  }
  return parsedPhoneNumber.format('NATIONAL')
}
