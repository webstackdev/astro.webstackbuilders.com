/**
 * Custom error class for client-side script errors
 * Extends Error with additional context support
 */

export interface ErrorContext {
  component?: string
  action?: string
  fileName?: string
  lineNumber?: number
  columnNumber?: number
  [key: string]: unknown
}

export class ClientScriptError extends Error {
  public readonly context?: ErrorContext | undefined

  constructor(message: string, context?: ErrorContext | undefined) {
    super(message)

    // Set error name
    Object.defineProperty(this, 'name', {
      value: 'ClientScriptError',
      enumerable: false,
      configurable: true,
    })

    // Fix prototype chain for ES5 compatibility
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace in V8
    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, ClientScriptError)
    }

    // Set context
    this.context = context
  }

  /**
   * Convert error to JSON for logging/transmission
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      context: this.context,
    }
  }
}
