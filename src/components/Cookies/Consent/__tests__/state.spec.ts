/**
 * State tests for cookie consent modal visibility
 * Now uses centralized state store from lib/state
 */
import { beforeEach, describe, expect, test } from 'vitest'
import { AppBootstrap } from '@components/Scripts/bootstrap/client'
import {
  consentModalStateKey,
  getCookieModalVisibility,
  setCookieModalVisibility,
  initCookieModalVisibility,
} from '../state'

describe(`Cookie modal visibility using state store`, () => {
  beforeEach(() => {
    // Initialize state management before each test
    AppBootstrap.init()
  })

  test(`returns false from state store by default`, () => {
    // State store initializes with false
    expect(getCookieModalVisibility()).toBe(false)
  })

  test(`returns true from state store when set to true`, () => {
    setCookieModalVisibility(true)
    expect(getCookieModalVisibility()).toBe(true)
  })

  test(`returns false from state store when set to false`, () => {
    setCookieModalVisibility(true)
    setCookieModalVisibility(false)
    expect(getCookieModalVisibility()).toBe(false)
  })

  test(`sets state store value`, () => {
    setCookieModalVisibility(true)
    expect(getCookieModalVisibility()).toBe(true)
  })

  test(`initializes state store to true`, () => {
    initCookieModalVisibility()
    expect(getCookieModalVisibility()).toBe(true)
  })

  test(`state key constant is preserved for backwards compatibility`, () => {
    expect(consentModalStateKey).toBe(`COOKIE_MODAL_VISIBLE`)
  })
})
