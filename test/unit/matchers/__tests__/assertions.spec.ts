/**
 * Tests for custom matchers
 */
import { describe, expect, test } from '@jest/globals'
import {
  isConstructible,
  isObject,
  isSyncExpectationResult,
  isAsyncExpectationResult,
} from '../assertions'

describe('isObject assertion works', () => {
  test('isObject returns true with an object literal', () => {
    const sut = isObject({})
    expect(sut).toBeTruthy()
  })


  test('isObject returns false with a primitive', () => {
    const sut = isObject(`test string`)
    expect(sut).toBeFalsy()
  })


  test('isObject returns false with a function', () => {
    const sut = isObject(() => {})
    expect(sut).toBeFalsy()
  })


  test('isObject returns false with an array', () => {
    const sut = isObject([])
    expect(sut).toBeFalsy()
  })
})

describe(`assertions for isConstructible custom matcher works`, () => {
  test(`isConstructible returns true with a valid constructor`, () => {
    class TestClass {}
    const sut = isConstructible(TestClass)
    expect(sut).toBeTruthy()
  })

  test(`isConstructible returns true with a plain function`, () => {
    function testFn() {}
    const sut = isConstructible(testFn)
    expect(sut).toBeTruthy()
  })

  test(`isConstructible returns true with object method`, () => {
    const testLiteral = {
      testFn: function () {},
    }
    const sut = isConstructible(testLiteral.testFn)
    expect(sut).toBeTruthy()
  })

  test(`isConstructible returns false with shorthand method`, () => {
    const testLiteral = {
      shorthandFn() {},
    }
    const sut = isConstructible(testLiteral.shorthandFn)
    expect(sut).toBeFalsy()
  })

  test(`isConstructible returns false with arrow function`, () => {
    const testLambdaFn = () => {}
    const sut = isConstructible(testLambdaFn)
    expect(sut).toBeFalsy()
  })
})

const syncExpectationResult = {
  pass: true,
  message: () => `sync test message`,
}

const asyncExpectationResult = new Promise((resolve) => {
  resolve({
    pass: true,
    message: () => `async test message`,
  })
})

describe(`isSyncExpectationResult assertion works`, () => {
  test(`isSyncExpectationResult returns true with sync result`, () => {
    const sut = isSyncExpectationResult(syncExpectationResult)
    expect(sut).toBeTruthy()
  })

  test(`isSyncExpectationResult returns false with async result`, () => {
    const sut = isSyncExpectationResult(asyncExpectationResult)
    expect(sut).toBeFalsy()
  })

  test(`isSyncExpectationResult returns false with empty object literal result`, () => {
    const sut = isSyncExpectationResult({})
    expect(sut).toBeFalsy()
  })
})

describe(`isAsyncExpectationResult assertion works`, () => {
  test(`isSyncExpectationResult returns true with async result`, () => {
    const sut = isAsyncExpectationResult(asyncExpectationResult)
    expect(sut).toBeTruthy()
  })

  test(`isSyncExpectationResult returns false with sync result`, () => {
    const sut = isAsyncExpectationResult(syncExpectationResult)
    expect(sut).toBeFalsy()
  })

  test(`isSyncExpectationResult returns false with empty object literal result`, () => {
    const sut = isAsyncExpectationResult({})
    expect(sut).toBeFalsy()
  })
})
