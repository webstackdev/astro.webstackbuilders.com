/**
 * Tests for HTML element selectors
 * @vitest-environment jsdom
 */
import { describe, expect, test } from "vitest"
import {
  isButtonElement,
  isDivElement,
  isHeaderElement,
  isSpanElement,
  isUlElement,
} from "@lib/utils/assertions/elements"
import {
  getHeaderElement,
  getMobileSplashElement,
  getNavMenuElement,
  getNavToggleBtnElement,
  getNavToggleWrapperElement,
  getNavWrapperElement,
} from "../selectors"
import { setupNavigationDOM } from "./testHelper"

describe('getHeaderElement selector works', () => {
  test(' works with element in DOM', async () => {
    setupNavigationDOM()
    const sut = isHeaderElement(getHeaderElement())
    expect(sut).toBeTruthy()
  })

  test(' throws with no results selected against DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getHeaderElement()).toThrow()
  })
})

describe('getMobileSplashElement selector works', () => {
  test(' works with element in DOM', async () => {
    setupNavigationDOM()
    const sut = isDivElement(getMobileSplashElement())
    expect(sut).toBeTruthy()
  })

  test(' throws with no results selected against DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getMobileSplashElement()).toThrow()
  })
})

describe('getNavWrapperElement selector works', () => {
  test(' works with element in DOM', async () => {
    setupNavigationDOM()
    const sut = isSpanElement(getNavWrapperElement())
    expect(sut).toBeTruthy()
  })

  test(' throws with no results selected against DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getNavWrapperElement()).toThrow()
  })
})

describe('getNavMenuElement selector works', () => {
  test('getNavElement works with element in DOM', async () => {
    setupNavigationDOM()
    const sut = getNavMenuElement()
    expect(isUlElement(sut)).toBeTruthy()
  })

  test('getNavElement throws with no results selected against DOM', () => {
    document.body.innerHTML = `<nav class="main-nav" role="navigation"></nav>`
    expect(() => getNavMenuElement()).toThrow()
  })
})

describe('getNavToggleWrapperElement selector works', () => {
  test('getNavToggleWrapperElement works with element in DOM', async () => {
    setupNavigationDOM()
    const sut = getNavToggleWrapperElement()
    expect(isSpanElement(sut)).toBeTruthy()
  })

  test('getNavToggleWrapperElement throws with no results selected against DOM', () => {
    document.body.innerHTML = `<nav class="main-nav" role="navigation"></nav>`
    expect(() => getNavToggleWrapperElement()).toThrow()
  })
})

describe('getNavToggleBtnElement selector works', () => {
  test('getNavToggleBtnElement works with element in DOM', async () => {
    setupNavigationDOM()
    const sut = getNavToggleBtnElement()
    expect(isButtonElement(sut)).toBeTruthy()
  })

  test('getNavToggleBtnElement throws with no <slot> elements in the shadow DOM', () => {
    document.body.innerHTML = `<nav class="main-nav" role="navigation"></nav>`
    expect(() => getNavToggleBtnElement()).toThrow()
  })
})
