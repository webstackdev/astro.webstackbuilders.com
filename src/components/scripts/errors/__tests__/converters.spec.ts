// @vitest-environment jsdom
/**
 * Tests for error converters to ClientScriptError
 */
import { describe, expect, test } from 'vitest'
import { TestError } from '@test/errors'
import { ClientScriptError } from '@components/scripts/errors'
import {
  convertFromError,
  convertFromClientScriptError,
  convertFromErrorEvent,
  convertFromPromiseRejectionEvent,
  convertFromPrimitive,
  extractMetadaFromStackTrace,
  normalizeMessage,
} from '@components/scripts/errors/converters'
import { isString } from '@components/scripts/assertions/primitives'
import { PromiseRejectionEvent } from '@components/scripts/@types/PromiseRejectionEvent'

const voidFn = () => {}

describe(`extractMetadaFromStackTrace correctly pulls metadata from stack trace`, () => {
  test(`extractMetadaFromStackTrace gets correct metadata`, () => {
    const err = new TestError(`test error`)
    const stack = err.stack
    if (!isString(stack)) throw new TestError(`Expected stack to be a string`)
    const sut = extractMetadaFromStackTrace(stack)
    expect(sut).toEqual(
      expect.objectContaining({
        fileName: expect.stringContaining(`converters.spec.ts`),
        lineNumber: expect.any(String),
        columnNumber: expect.any(String),
      })
    )
  })

  test.each(['Error: network failure', 'Error: network failure\n    at new ClientScriptError'])(
    'handles a stack with no remaining frames: %s',
    stack => {
      expect(extractMetadaFromStackTrace(stack)).toEqual({
        fileName: undefined,
        lineNumber: undefined,
        columnNumber: undefined,
      })
      const error = new Error('network failure')
      error.stack = stack
      expect(new ClientScriptError(error).message).toBe('network failure')
    }
  )

  test('extracts metadata from a Firefox-style stack', () => {
    expect(extractMetadaFromStackTrace('load@https://example.com/app.js:42:13')).toEqual({
      fileName: 'https://example.com/app.js',
      lineNumber: '42',
      columnNumber: '13',
    })
  })
})

describe(`Converts from Error`, () => {
  test(`convertFromError`, () => {
    const sut = convertFromError(new TestError(`test error`))
    expect(sut).toEqual(
      expect.objectContaining({
        message: `test error`,
        stack: expect.any(String),
        fileName: expect.any(String),
        lineNumber: expect.any(String),
        columnNumber: expect.any(String),
      })
    )
    // Error does not have a cause by default, so it shouldn't be included
    expect(sut.cause).toBeUndefined()
    expect(sut.fileName).toEqual(expect.stringContaining(`converters.spec.ts`))
  })
})

describe(`Converts from ClientScriptError`, () => {
  test(`convertFromClientScriptError`, () => {
    const sut = convertFromClientScriptError(new ClientScriptError(`custom test error`))
    expect(sut).toEqual(
      expect.objectContaining({
        message: `custom test error`,
        stack: expect.any(String),
        cause: expect.any(Object),
        fileName: expect.any(String),
        lineNumber: expect.any(String),
        columnNumber: expect.any(String),
      })
    )
    expect(sut.cause).toBeInstanceOf(ClientScriptError)
    expect(sut.fileName).toEqual(expect.stringContaining(`converters.spec.ts`))
  })
})

describe(`Converts from convertFromErrorEvent`, () => {
  test(`convertFromErrorEvent`, () => {
    const sut = convertFromErrorEvent(new ErrorEvent(`test error`))
    expect(sut).toMatchInlineSnapshot(`
      {
        "cause": null,
        "message": "",
      }
    `)
  })
})

describe(`Converts from convertFromPromiseRejectionEvent`, () => {
  test(`convertFromPromiseRejectionEvent`, () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: `test promise rejection`,
    }
    const sut = convertFromPromiseRejectionEvent(
      new PromiseRejectionEvent(`unhandledrejection`, RejectionInit)
    )
    expect(sut.message).toEqual(expect.stringContaining(`test promise rejection`))
    expect(sut.columnNumber).toBeNil()
    expect(sut.fileName).toBeNil()
    expect(sut.lineNumber).toBeNil()
    expect(sut.stack).toBeNil()
  })
})

describe(`Converts from convertFromPrimitive`, () => {
  test(`convertFromPrimitive with string`, () => {
    const sut = convertFromPrimitive(`test string`)
    expect(sut.message).toEqual(expect.stringContaining(`test string`))
    expect(sut.columnNumber).toBeNil()
    expect(sut.fileName).toBeNil()
    expect(sut.lineNumber).toBeNil()
    expect(sut.stack).toBeNil()
  })

  test(`convertFromPrimitive with number`, () => {
    const sut = convertFromPrimitive(14)
    expect(sut.message).toEqual(expect.stringContaining(`14`))
    expect(sut.columnNumber).toBeNil()
    expect(sut.fileName).toBeNil()
    expect(sut.lineNumber).toBeNil()
    expect(sut.stack).toBeNil()
  })

  test(`convertFromPrimitive with undefined`, () => {
    const sut = convertFromPrimitive(undefined)
    expect(sut.message).toBeFalsy() // empty string
    expect(sut.columnNumber).toBeNil()
    expect(sut.fileName).toBeNil()
    expect(sut.lineNumber).toBeNil()
    expect(sut.stack).toBeNil()
  })

  test(`convertFromPrimitive with object`, () => {
    const sut = convertFromPrimitive({})
    expect(sut.message).toEqual(expect.stringContaining(`[object Object]`))
    expect(sut.columnNumber).toBeNil()
    expect(sut.fileName).toBeNil()
    expect(sut.lineNumber).toBeNil()
    expect(sut.stack).toBeNil()
  })
})

describe(`Integration test for normalizeMessage`, () => {
  test(`normalizeMessage handles Error correctly`, () => {
    const sut = normalizeMessage(new Error(`test error`))
    expect(sut).toEqual(
      expect.objectContaining({
        stack: expect.stringMatching(/^Error: test error/),
      })
    )
  })

  test(`normalizeMessage handles ClientScriptError correctly`, () => {
    const sut = normalizeMessage(new ClientScriptError(`test error`))
    expect(sut).toEqual(
      expect.objectContaining({
        stack: expect.stringMatching(/^ClientScriptError: test error/),
      })
    )
  })

  test(`normalizeMessage handles ErrorEvent correctly`, () => {
    const sut = normalizeMessage(new ErrorEvent(`test error`))
    expect(sut).toBeObject()
  })

  test(`normalizeMessage handles convertFromPromiseRejectionEvent correctly`, () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: `test promise rejection`,
    }
    const sut = normalizeMessage(new PromiseRejectionEvent(`unhandledrejection`, RejectionInit))
    expect(sut.message).toEqual(expect.stringContaining(`test promise rejection`))
  })

  test(`normalizeMessage handles string correctly`, () => {
    const sut = normalizeMessage(`test string`)
    expect(sut.message).toEqual(expect.stringContaining(`test string`))
  })

  test(`normalizeMessage handles number correctly correctly`, () => {
    const sut = normalizeMessage(14)
    expect(sut.message).toEqual(expect.stringContaining(`14`))
  })

  test(`normalizeMessage handles undefined correctly`, () => {
    const sut = normalizeMessage(undefined)
    expect(sut.message).toBeFalsy() // empty string
  })

  test(`normalizeMessage handles object correctly`, () => {
    const sut = normalizeMessage({})
    expect(sut.message).toEqual(expect.stringContaining(`[object Object]`))
  })
})
