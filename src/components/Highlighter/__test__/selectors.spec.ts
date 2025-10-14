/**
 * Tests for HTML element selectors
 */
import { describe, expect, test } from "vitest"
import {
  isBodyElement,
  isHtmlElement,
  isType1Element,
} from "../../../lib/utils/assertions/elements"
import {
  getBodyElement,
  getHtmlElement,
  queryDocument,
  queryAllDocument,
} from "../selectors"

describe('Generic selectors work', () => {
  test('Generic queryDocument works with valid selector against DOM', () => {
    document.body.innerHTML = `<div></div>`
    const sut = isType1Element(queryDocument('div'))
    expect(sut).toBeTruthy()
  })

  test('Generic queryDocument throws with no results selected against DOM', () => {
    document.body.innerHTML = `<span></span>`
    expect(() => queryDocument('div')).toThrow()
  })

  test('Generic queryAllDocument works with valid selector against DOM', () => {
    document.body.innerHTML = `<div></div><div></div>`
    const sut = queryAllDocument('div')
    expect(sut).toHaveLength(2)
    expect(isType1Element(sut[0])).toBeTruthy()
    expect(isType1Element(sut[1])).toBeTruthy()
  })

  test('Generic queryAllDocument throws with no results selected against DOM', () => {
    document.body.innerHTML = `<span></span>`
    expect(() => queryAllDocument('div')).toThrow()
  })
})

describe('getBodyElement selector works', () => {
  test('getBodyElement works with valid selector against DOM', () => {
    document.body.innerHTML = `<span></span>`
    const sut = isBodyElement(getBodyElement())
    expect(sut).toBeTruthy()
  })
})

describe('getHtmlElement selector works', () => {
  test('getHtmlElement works with valid selector against DOM', () => {
    document.body.innerHTML = `<span></span>`
    const sut = isHtmlElement(getHtmlElement())
    expect(sut).toBeTruthy()
  })
})
