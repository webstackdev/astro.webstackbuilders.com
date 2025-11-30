// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  isAnchorElement,
  isBodyElement,
  isButtonElement,
  isDivElement,
  isFormElement,
  isHeaderElement,
  isHtmlElement,
  isImageElement,
  isInputElement,
  isLabelElement,
  isMetaElement,
  isNavElement,
  isShadowRoot,
  isSlotElement,
  isSpanElement,
  isType1Element,
  isUlElement,
} from '../elements'

describe('element assertions', () => {
  const createElement = <K extends keyof HTMLElementTagNameMap>(tagName: K) =>
    document.createElement(tagName)

  it('identifies basic type 1 elements and rejects non-elements', () => {
    const div = createElement('div')
    const text = document.createTextNode('text-only')

    expect(isType1Element(div)).toBe(true)
    expect(isType1Element(text)).toBe(false)
    expect(isType1Element(null)).toBe(false)
  })

  it('matches tag specific guards', () => {
    expect(isAnchorElement(createElement('a'))).toBe(true)
    expect(isBodyElement(document.body)).toBe(true)
    expect(isButtonElement(createElement('button'))).toBe(true)
    expect(isDivElement(createElement('div'))).toBe(true)
    expect(isFormElement(createElement('form'))).toBe(true)
    expect(isHeaderElement(createElement('header'))).toBe(true)
    expect(isHtmlElement(document.documentElement)).toBe(true)
    expect(isImageElement(createElement('img'))).toBe(true)
    expect(isInputElement(createElement('input'))).toBe(true)
    expect(isLabelElement(createElement('label'))).toBe(true)
    expect(isMetaElement(createElement('meta'))).toBe(true)
    expect(isNavElement(createElement('nav'))).toBe(true)
    expect(isSlotElement(createElement('slot'))).toBe(true)
    expect(isSpanElement(createElement('span'))).toBe(true)
    expect(isUlElement(createElement('ul'))).toBe(true)
  })

  it('rejects mismatched tag names', () => {
    const div = createElement('div')
    expect(isAnchorElement(div)).toBe(false)
    expect(isFormElement(div)).toBe(false)
    expect(isInputElement(div)).toBe(false)
  })

  it('validates open shadow roots only', () => {
    const openHost = createElement('div')
    const closedHost = createElement('div')
    const openRoot = openHost.attachShadow({ mode: 'open' })
    const closedRoot = closedHost.attachShadow({ mode: 'closed' })

    expect(isShadowRoot(openRoot)).toBe(true)
    expect(isShadowRoot(closedRoot)).toBe(false)
    expect(isShadowRoot({})).toBe(false)
  })
})
