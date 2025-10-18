/**
 * Tests for error handling routines
 */
import { describe, expect, test } from 'vitest'
import { PromiseRejectionEvent } from '@lib/@types/PromiseRejectionEvent'
import { ClientScriptError } from '../ClientScriptError'
import {
  unhandledExceptionHandler,
  unhandledRejectionHandler,
  promiseErrorHandler,
} from '../handlers'

const voidFn = () => {}

describe('unhandledExceptionHandler', () => {
  test('unhandledExceptionHandler', () => {
    const sut = unhandledExceptionHandler(new ErrorEvent(`test error`))
    expect(sut).toBeTruthy()
  })
})

describe('unhandledRejectionHandler', () => {
  // window.addEventListener('unhandledrejection', event => unhandledRejectionHandler(event))
  test('unhandledRejectionHandler', () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: `test promise rejection`,
    }
    const sut = unhandledRejectionHandler(
      new PromiseRejectionEvent(`unhandledrejection`, RejectionInit)
    )
    expect(sut).toBeTruthy()
  })
})

describe('promiseErrorHandler', () => {
  test('promiseErrorHandler with error object', () => {
    const sut = () => promiseErrorHandler(new Error(`test error`))
    expect(sut).toThrow(ClientScriptError)
  })

  test('promiseErrorHandler with string message', () => {
    const sut = () => promiseErrorHandler(`test error`)
    expect(sut).toThrow(ClientScriptError)
  })
})
