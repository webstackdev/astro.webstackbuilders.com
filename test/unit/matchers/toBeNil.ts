/**
 * From 'jest-extended', but that library does not compile due to bad typings
 */
import { type RawMatcherFn } from "@vitest/expect"

export const toBeNil: RawMatcherFn = function (actual: unknown) {
  const { printReceived, matcherHint } = this.utils

  const passHint = matcherHint('.not.toBeNil', 'received', '')
  const passPrint = printReceived(actual)
  const passMessage = `${passHint}\n\nExpected value not to be null or undefined, received:\n  ${passPrint}`

  const failHint = matcherHint('.toBeNil', 'received', '')
  const failPrint = printReceived(actual)
  const failMessage = `${failHint}\n\nExpected value to be null or undefined, received:\n  ${failPrint}`

  /* eslint-disable-next-line no-null/no-null */
  const pass = actual === undefined || actual === null
  return { pass, message: () => (pass ? passMessage : failMessage) }
}
