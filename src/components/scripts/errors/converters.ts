/**
 * Convert various errors to ClientScriptError
 */
import { isString } from '@components/scripts/assertions/primitives'
import { ClientScriptError, type ClientScriptErrorParams } from './ClientScriptError'
import { isError, isErrorEvent, isPromiseRejectionEvent, isClientScriptError } from './assertions'

/**
 * Helper function to create ClientScriptErrorParams without undefined values
 */
function createErrorParams(params: {
  message: string
  stack?: string | undefined
  cause?: unknown
  fileName?: string | undefined
  columnNumber?: string | undefined
  lineNumber?: string | undefined
}): ClientScriptErrorParams {
  const result: ClientScriptErrorParams = { message: params.message }
  if (params.stack !== undefined) result.stack = params.stack
  if (params.cause !== undefined) result.cause = params.cause
  if (params.fileName !== undefined) result.fileName = params.fileName
  if (params.columnNumber !== undefined) result.columnNumber = params.columnNumber
  if (params.lineNumber !== undefined) result.lineNumber = params.lineNumber
  return result
}

export const normalizeMessage = (message: unknown): ClientScriptErrorParams => {
  if (isClientScriptError(message)) {
    return convertFromClientScriptError(message)
  } else if (isError(message)) {
    return convertFromError(message)
  } else if (isErrorEvent(message)) {
    return convertFromErrorEvent(message)
  } else if (isPromiseRejectionEvent(message)) {
    return convertFromPromiseRejectionEvent(message)
  } else {
    return convertFromPrimitive(message)
  }
}

interface stackMetadata {
  fileName?: string | undefined
  lineNumber?: string | undefined
  columnNumber?: string | undefined
}

export const extractMetadaFromStackTrace = (stack: string | undefined): stackMetadata => {
  if (!isString(stack)) {
    return {
      fileName: undefined,
      lineNumber: undefined,
      columnNumber: undefined,
    }
  }
  const poppedStackArr = stack.split('\n')
  /* Discard first line of stack if it is of the form 'Error: test error' */
  if (isString(poppedStackArr[0]) && /^[a-zA-Z]*Error:/.test(poppedStackArr[0])) {
    poppedStackArr.shift()
  }
  /* Discard next line of stack if it is thrown from project custom error */
  if (isString(poppedStackArr[0]) && /at new ClientScriptError/.test(poppedStackArr[0])) {
    poppedStackArr.shift()
  }

  if (!isString(poppedStackArr[0])) throw new Error()

  const stackLine = poppedStackArr.shift() as string
  // Try to match both formats: (path:line:col) and "at path:line:col"
  const match = /\((.*):(\d+):(\d+)\)$/.exec(stackLine) || /at\s+(.+):(\d+):(\d+)/.exec(stackLine)
  return {
    fileName: match && isString(match[1]) ? match[1] : undefined,
    lineNumber: match && isString(match[2]) ? match[2] : undefined,
    columnNumber: match && isString(match[3]) ? match[3] : undefined,
  }
}

/**
 * Convert Error to ClientScriptErrorParams
 */
export function convertFromError(error: Error): ClientScriptErrorParams {
  const { fileName, lineNumber, columnNumber } = extractMetadaFromStackTrace(error.stack)
  return createErrorParams({
    message: error.message || 'Unknown error',
    stack: error.stack,
    cause: error.cause,
    fileName,
    columnNumber,
    lineNumber,
  })
}

/**
 * Convert ClientScriptError to ClientScriptErrorParams
 */
export const convertFromClientScriptError = (input: ClientScriptError): ClientScriptErrorParams => {
  const { fileName, lineNumber, columnNumber } = extractMetadaFromStackTrace(input['stack'])
  return createErrorParams({
    message: input.message,
    stack: input.stack,
    cause: input,
    fileName,
    columnNumber,
    lineNumber,
  })
}

/**
 * Convert ErrorEvent to ClientScriptErrorParams
 */
export const convertFromErrorEvent = (input: ErrorEvent): ClientScriptErrorParams => {
  return createErrorParams({
    message: input.message,
    cause: input.error,
    fileName: input.filename || undefined,
    columnNumber: input.colno ? String(input.colno) : undefined,
    lineNumber: input.lineno ? String(input.lineno) : undefined,
  })
}

/**
 * Convert PromiseRejectionEvent to ClientScriptErrorParams
 */
export const convertFromPromiseRejectionEvent = (
  input: PromiseRejectionEvent
): ClientScriptErrorParams => {
  return createErrorParams({
    message: input.reason,
    cause: input.promise,
  })
}

/**
 * Convert primitive value to ClientScriptErrorParams
 */
export const convertFromPrimitive = (input: unknown): ClientScriptErrorParams => {
  return createErrorParams({
    message: input ? String(input) : '',
  })
}
