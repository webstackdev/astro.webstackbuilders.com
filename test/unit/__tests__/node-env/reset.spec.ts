/**
 * Unit tests for setup state module
 */
import { describe, expect, test } from '@jest/globals'
import { JSDOM, type DOMWindow } from 'jsdom'
import {
  removeRootAttributes,
  removeRootChildElements,
  restoreRootBaseElements,
} from '../../environment/reset'

describe('removeRootAttributes works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('removes attributes from <html> element in HTML documents', () => {
    const html = document.querySelector('html')!
    html.setAttribute(`data-testid`, `custom-element`)
    removeRootAttributes(document.documentElement)
    expect(html.attributes).toHaveLength(0)
  })
})

describe('removeRootChildElements works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('removes child elements from root element in HTML document', () => {
    const body = document.querySelector('body')!
    body.innerHTML = `<div>TEST</div>`
    removeRootChildElements(document.documentElement)
    expect(document.querySelector('div')).toBeFalsy()
  })
})

describe('restoreRootBaseElements works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('restores <head> and <body> HTML document', () => {
    const html = document.querySelector('html')!
    const head = document.querySelector('head')!
    const body = document.querySelector('body')!
    html.removeChild(head)
    html.removeChild(body)
    restoreRootBaseElements(html)
    expect(document.querySelector('head')).toBeTruthy()
    expect(document.querySelector('body')).toBeTruthy()
  })
})
