/**
 * Tests for error converters to ClientScriptError
 */
import { describe, expect, test } from "vitest"
import { ClientScriptError } from "../ClientScriptError"
import {
  convertFromError,
  convertFromClientScriptError,
  convertFromErrorEvent,
  convertFromPromiseRejectionEvent,
  convertFromPrimitive,
  extractMetadaFromStackTrace,
  normalizeMessage,
} from "../converters"
import { isString } from "@components/Scripts/assertions/primitives"
import { PromiseRejectionEvent } from "@lib/@types/PromiseRejectionEvent"

const voidFn = () => {}

describe(`extractMetadaFromStackTrace correctly pulls metadata from stack trace`, () => {
  test(`extractMetadaFromStackTrace gets correct metadata`, () => {
    const err = new Error(`test error`)
    const stack = err.stack
    if (!isString(stack)) throw new Error()
    const sut = extractMetadaFromStackTrace(stack)
    expect(sut).toEqual(
      expect.objectContaining({
        fileName: expect.stringContaining(`converters.spec.ts`),
        lineNumber: expect.any(String),
        columnNumber: expect.any(String),
      })
    )
  })
})

describe(`Converts from Error`, () => {
  test(`convertFromError`, () => {
    const sut = convertFromError(new Error(`test error`))
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
