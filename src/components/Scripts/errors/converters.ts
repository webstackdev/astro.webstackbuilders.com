/**
 * Convert various errors to ClientScriptError
 */
import { isString } from "@lib/utils/assertions/primitives"
import { ClientScriptError, type ClientScriptErrorParams } from "./ClientScriptError"
import {
  isError,
  isErrorEvent,
  isPromiseRejectionEvent,
  isClientScriptError
} from "./assertions"

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

export interface stackMetadata {
  fileName?: string
  lineNumber?: string
  columnNumber?: string
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
  const match = /\((.*):(\d+):(\d+)\)$/.exec(stackLine) ||
                /at\s+(.+):(\d+):(\d+)/.exec(stackLine)
  return {
    fileName: match && isString(match[1]) ? match[1] : undefined,
    lineNumber: match && isString(match[2]) ? match[2] : undefined,
    columnNumber: match && isString(match[3]) ? match[3] : undefined,
  }
}

export const convertFromError = (input: Error): ClientScriptErrorParams => {
  const { fileName, lineNumber, columnNumber } = extractMetadaFromStackTrace(input['stack'])
  return {
    message: input.message,
    stack: input?.stack ? input.stack : undefined,
    cause: input,
    fileName,
    columnNumber,
    lineNumber,
  }
}

export const convertFromClientScriptError = (input: ClientScriptError): ClientScriptErrorParams => {
  const { fileName, lineNumber, columnNumber } = extractMetadaFromStackTrace(input['stack'])
  return {
    message: input.message,
    stack: input?.stack ? input.stack : undefined,
    cause: input,
    fileName,
    columnNumber,
    lineNumber,
  }
}

export const convertFromErrorEvent = (input: ErrorEvent): ClientScriptErrorParams => {
  return {
    message: input.message,
    stack: undefined,
    cause: input.error,
    fileName: input.filename ?? undefined,
    columnNumber: input.colno ? String(input.colno) : undefined,
    lineNumber: input.lineno ? String(input.lineno) : undefined,
  }
}

export const convertFromPromiseRejectionEvent = (
  input: PromiseRejectionEvent
): ClientScriptErrorParams => {
  return {
    message: input.reason,
    stack: undefined,
    cause: input.promise,
    fileName: undefined,
    columnNumber: undefined,
    lineNumber: undefined,
  }
}

export const convertFromPrimitive = (input: unknown): ClientScriptErrorParams => {
  return {
    message: input ? String(input) : '',
    stack: undefined,
    cause: undefined,
    fileName: undefined,
    columnNumber: undefined,
    lineNumber: undefined,
  }
}
