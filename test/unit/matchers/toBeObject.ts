/**
 * From 'jest-extended', but that library does not compile due to bad typings
 */
import { type RawMatcherFn } from "@vitest/expect"
import { getType } from "@test/unit/utils/getType"

export const toBeObject: RawMatcherFn = function (actual: unknown) {
  const { printReceived, matcherHint } = this.utils

  const passHint = matcherHint('.not.toBeObject', 'received', '')
  const passPrint = printReceived(actual)
  const passMessage = `${passHint}\n\nExpected value to not be an object, received:\n  ${passPrint}`


  const failHint = matcherHint('.toBeObject', 'received', '')
  const failPrint = printReceived(actual)
  const failMessage = `${failHint}\n\nExpected value to be an object, received:\n  ${failPrint}`

  const pass = getType(actual) === 'object'

  return { pass, message: () => (pass ? passMessage : failMessage) }
}
