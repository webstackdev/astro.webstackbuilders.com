// @vitest-environment jsdom
/**
 * Tests for error assertions
 */
import { describe, expect, test } from 'vitest'
import { TestError } from '@test/errors'
import { ClientScriptError } from '@components/scripts/errors'
import {
  isError,
  isErrorEvent,
  isPromiseRejectionEvent,
  isClientScriptError,
} from '@components/scripts/errors/assertions'
import { PromiseRejectionEvent } from '@components/scripts/@types/PromiseRejectionEvent'

const voidFn = () => {}

describe(`Assertion for Error object`, () => {
  test(`Error object returns true in isError assertion`, () => {
    const sut = isError(new TestError(`test error`))
    expect(sut).toBeTruthy()
  })

  test(`TypeError object returns true in isError assertion`, () => {
    const sut = isError(new TypeError())
    expect(sut).toBeTruthy()
  })
})

describe(`Assertion for ErrorEvent object`, () => {
  test(`ErrorEvent object returns true in isErrorEvent assertion`, () => {
    const sut = isErrorEvent(new ErrorEvent(`test error`))
    expect(sut).toBeTruthy()
  })

  test(`Error object returns false in isErrorEvent assertion`, () => {
    const sut = isErrorEvent(new Error())
    expect(sut).toBeFalsy()
  })
})

describe(`Assertion for PromiseRejectionEvent object`, () => {
  test(`PromiseRejectionEvent object is true in isPromiseRejectionEvent assertion`, () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: `test promise rejection`,
    }
    const sut = isPromiseRejectionEvent(
      new PromiseRejectionEvent(`unhandledrejection`, RejectionInit)
    )
    expect(sut).toBeTruthy()
  })

  test(`Error object returns false in isErrorEvent isPromiseRejectionEvent`, () => {
    const sut = isPromiseRejectionEvent(new Error())
    expect(sut).toBeFalsy()
  })
})

describe(`Assertion for ClientScriptError object`, () => {
  test(`ClientScriptError object returns true in isError assertion`, () => {
    const sut = isClientScriptError(new ClientScriptError(`test error`))
    expect(sut).toBeTruthy()
  })

  test(`TypeError object returns false in isError assertion`, () => {
    const sut = isClientScriptError(new TypeError())
    expect(sut).toBeFalsy()
  })
})
