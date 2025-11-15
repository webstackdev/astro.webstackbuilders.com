/**
 * Error-related assertions
 */
import { BuildError } from './BuildError'

/**
 * Type guard for string values
 * @param value - Value to check
 * @returns true if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String
}

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

export function isBuildError(error: unknown): error is BuildError {
  if (typeof error === 'object' && (error as Error).name === 'BuildError') return true
  return false
}
