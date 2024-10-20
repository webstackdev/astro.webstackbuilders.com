/**
 * Assertions for custom Jest matchers
 */
import type { ExpectationResult } from 'expect'

export function isObject(input: unknown): input is object {
  /* eslint-disable-next-line no-null/no-null */
  return typeof input === 'object' && !Array.isArray(input) && input !== null
}

export type Constructor = {
  new (...args: unknown[]): unknown
}

export function isConstructible(fn: unknown): fn is Constructor {
  const handler = {
    construct() {
      return handler
    },
  }
  if (typeof fn !== 'function') return false
  try {
    const ProxiedFn = new Proxy(fn as Constructor, handler)
    return !!new ProxiedFn()
  } catch (e) {
    return false
  }
}

/** not exported by Jest */
export type SyncExpectationResult = {
  pass: boolean
  message(): string
}

export function isSyncExpectationResult(
  result: unknown
): result is Extract<ExpectationResult, SyncExpectationResult> {
  return (
    isObject(result) &&
    Promise.resolve(result) !== result &&
    typeof result === 'object' &&
    Object.prototype.hasOwnProperty.call(result, `pass`)
  )
}

/** not exported by Jest */
export type AsyncExpectationResult = Promise<{
  pass: boolean
  message(): string
}>

export function isAsyncExpectationResult(
  result: unknown
): result is Extract<ExpectationResult, AsyncExpectationResult> {
  return Promise.resolve(result) === result
}
