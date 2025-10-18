/**
 * Error-related assertions
 */
import { ClientScriptError } from './ClientScriptError'
import type { PromiseRejectionEvent } from '../@types/PromiseRejectionEvent'

export function isError(error: unknown): error is Error {
  if (typeof error === 'object' && (error as Error).name === 'Error') return true
  return false
}

export function isErrorEvent(error: unknown): error is ErrorEvent {
  let result = false
  if (error && typeof error === 'object') {
    const props = [`colno`, `error`, `filename`, `lineno`, `message`]
    result = props.every(prop => {
      return prop in error
    })
  }
  return result
}

export function isPromiseRejectionEvent(error: unknown): error is PromiseRejectionEvent {
  if (error && typeof error === 'object') {
    return `reason` in error
  }
  return false
}

export function isClientScriptError(error: unknown): error is ClientScriptError {
  if (typeof error === 'object' && (error as Error).name === 'ClientScriptError') return true
  return false
}
