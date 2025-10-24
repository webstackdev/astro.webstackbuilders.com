// @vitest-environment happy-dom
/**
 * Tests for error handling routines
 */
import { describe, expect, test, beforeEach } from 'vitest'
import { PromiseRejectionEvent } from '@lib/@types/PromiseRejectionEvent'
import {
  unhandledExceptionHandler,
  unhandledRejectionHandler,
} from '../handlers'

const voidFn = () => {}

describe('unhandledExceptionHandler', () => {
  beforeEach(() => {
    // Clear window globals
    window._isError = false
    if ('_error' in window) {
      delete (window as {_error?: unknown})._error
    }
  })

  test('should set window._isError to true', () => {
    unhandledExceptionHandler(new ErrorEvent('test error'))
    expect(window._isError).toBe(true)
  })

  test('should set window._error as array with ClientScriptError', () => {
    unhandledExceptionHandler(new ErrorEvent('test error'))
    expect(window._error).toBeDefined()
    expect(Array.isArray(window._error)).toBe(true)
    expect(window._error).toHaveLength(1)
    expect(window._error?.[0]).toHaveProperty('message')
    expect(window._error?.[0]).toHaveProperty('stack')
  })

  test('should append to window._error array if already exists', () => {
    unhandledExceptionHandler(new ErrorEvent('first error'))
    unhandledExceptionHandler(new ErrorEvent('second error'))
    expect(window._error).toHaveLength(2)
  })

  test('should return true to prevent default handler', () => {
    const result = unhandledExceptionHandler(new ErrorEvent('test error'))
    expect(result).toBe(true)
  })
})

describe('unhandledRejectionHandler', () => {
  beforeEach(() => {
    // Clear window globals
    window._isError = false
    if ('_error' in window) {
      delete (window as {_error?: unknown})._error
    }
  })

  test('should set window._isError to true', () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: 'test promise rejection',
    }
    unhandledRejectionHandler(
      new PromiseRejectionEvent('unhandledrejection', RejectionInit)
    )
    expect(window._isError).toBe(true)
  })

  test('should set window._error as array with ClientScriptError', () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: 'test promise rejection',
    }
    unhandledRejectionHandler(
      new PromiseRejectionEvent('unhandledrejection', RejectionInit)
    )
    expect(window._error).toBeDefined()
    expect(Array.isArray(window._error)).toBe(true)
    expect(window._error).toHaveLength(1)
    expect(window._error?.[0]).toHaveProperty('message')
    expect(window._error?.[0]).toHaveProperty('stack')
  })

  test('should append to window._error array if already exists', () => {
    const RejectionInit1: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: 'first rejection',
    }
    const RejectionInit2: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: 'second rejection',
    }
    unhandledRejectionHandler(
      new PromiseRejectionEvent('unhandledrejection', RejectionInit1)
    )
    unhandledRejectionHandler(
      new PromiseRejectionEvent('unhandledrejection', RejectionInit2)
    )
    expect(window._error).toHaveLength(2)
  })

  test('should return true to prevent default handler', () => {
    const RejectionInit: PromiseRejectionEventInit = {
      promise: new Promise(voidFn),
      reason: 'test promise rejection',
    }
    const result = unhandledRejectionHandler(
      new PromiseRejectionEvent('unhandledrejection', RejectionInit)
    )
    expect(result).toBe(true)
  })
})
