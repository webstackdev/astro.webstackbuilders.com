/**
 * Interface for ClientScriptError
 * 
 * This is a standalone interface file with no dependencies to avoid
 * circular import issues and path alias problems in browser contexts.
 * 
 * Used for type annotations where the full ClientScriptError class
 * cannot be imported due to dependency chain issues.
 */
export interface ClientScriptErrorParams {
  message: string
  stack?: string | undefined
  cause?: unknown
  fileName?: string | undefined
  columnNumber?: string | undefined
  lineNumber?: string | undefined
}

export interface IClientScriptError extends Error {
  fileName?: string | undefined
  columnNumber?: string | undefined
  lineNumber?: string | undefined
  toJSON(): {
    error: {
      name: string
      message: string
      stack: string | undefined
      cause: unknown
      fileName: string | undefined
      columnNumber: string | undefined
      lineNumber: string | undefined
    }
  }
}
