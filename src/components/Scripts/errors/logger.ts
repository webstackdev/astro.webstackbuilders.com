import { type ClientScriptErrorParams } from './ClientScriptError'

/**
 * Log an error that has been normalized to a ClientScriptError
 */
export const logError = ({
  message,
  cause,
  fileName,
  columnNumber,
  lineNumber,
}: ClientScriptErrorParams): void => {
  const logMessage: string[] = [`Message: ${message}`]

  if (fileName) logMessage.push(`File: ${fileName}`)
  if (lineNumber) logMessage.push(`Line: ${lineNumber.toString()}`)
  if (columnNumber) logMessage.push(`Column: ${columnNumber.toString()}`)
  if (cause) logMessage.push(`Error object: ${JSON.stringify(cause)}`)

  console.log(logMessage.join(' - '))
}
