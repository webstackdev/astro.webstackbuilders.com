/**
 * Tests for error handling routines and custom errors
 */
import { afterEach, describe, expect, test, vi } from "vitest"
import { type ClientScriptErrorParams } from "../ClientScriptError"
import { logError } from "../logger"

describe('Logger outputs to console', () => {
  const errorParamFixture: ClientScriptErrorParams = {
    message: `test message`,
    cause: new Error(`cause error`),
    fileName: `/tmp/file.ts`,
    columnNumber: `14`,
    lineNumber: `7`,
  }

  const consoleSpy = vi.spyOn(console, 'log')

  afterEach(() => {
    consoleSpy.mockReset()
  })

  test('Logger logs formatted string to console', () => {
    const sut = logError(errorParamFixture)
    expect(sut).toBeFalsy()
    expect(consoleSpy).toHaveBeenCalledWith(
      `Message: test message - File: /tmp/file.ts - Line: 7 - Column: 14 - Error object: {}`
    )
  })
})
