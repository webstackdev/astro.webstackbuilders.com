/**
 * Custom error for client-side script
 */
import { normalizeMessage } from "./converters"

export interface ClientScriptErrorParams {
  message: string
  stack?: string
  cause?: unknown
  fileName?: string
  columnNumber?: string
  lineNumber?: string
}

export class ClientScriptError extends Error {
  fileName?: string | undefined
  columnNumber?: string | undefined
  lineNumber?: string | undefined

  constructor(message?: unknown) {
    const data = normalizeMessage(message)
    super(data.message)
    /**
     * Set error name as constructor name and make it not enumerable to
     * keep native Error behavior
     */
    Object.defineProperty(this, 'name', {
      value: 'ClientScriptError',
      enumerable: false,
      configurable: true,
    })
    /** Fix the extended error prototype chainbecause Typescript __extends can't */
    Object.setPrototypeOf(this, new.target.prototype)
    /** Remove constructor from stack trace in V8 */
    if ('captureStackTrace' in Error) Error.captureStackTrace(this, ClientScriptError)
    /** V8 collects last 10 stack trace by default, this collects all */
    if ('stackTraceLimit' in Error) Error.stackTraceLimit = Infinity

    this.message = data.message
    this.cause = data.cause
    this.fileName = data.fileName
    this.columnNumber = data.columnNumber
    this.lineNumber = data.lineNumber
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        stack: this.stack,
      },
    }
  }
}
