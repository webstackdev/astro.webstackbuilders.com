/**
 * Tests for fake timer detection in Node environment
 */
import { describe, expect, test, afterEach, beforeEach } from '@jest/globals'
import { checkFakedTimerStatus } from '../../helpers/fakeTimers'

describe(`isTimerFaked works`, () => {
  test(`isTimerFaked returns true with fake timers`, () => {
    jest.useFakeTimers()
    expect(checkFakedTimerStatus()).toBeTruthy()
    jest.useRealTimers()
  })

  test(`isTimerFaked returns false with real timers`, () => {
    jest.useRealTimers()
    expect(checkFakedTimerStatus()).toBeFalsy()
  })


  test(`turning faked timers on then off works`, () => {
    jest.useFakeTimers()
    jest.useRealTimers()
    expect(checkFakedTimerStatus()).toBeFalsy()
  })
})

describe(`isTimerFaked works when fake timers set in before blocks`, () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test(`isTimerFaked returns true with fake timers`, () => {
    expect(checkFakedTimerStatus()).toBeTruthy()
  })

  test(`isTimerFaked returns false with real timers`, () => {
    jest.useRealTimers()
    expect(checkFakedTimerStatus()).toBeFalsy()
  })
})
