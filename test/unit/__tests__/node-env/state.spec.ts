/**
 * Unit tests for setup state module
 */
import { describe, expect, jest, test } from '@jest/globals'
import { JSDOM, type DOMWindow } from 'jsdom'
import { isListenerStateInstance, ListenerState, type removalCb } from '../../environment/state'

const listener = () => {
  console.log(`test`)
}

describe('Event listener tracking state works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('caches different add event listeners for window and document', () => {
    const state = new ListenerState(window as unknown as Window, document)
    expect(state.originalWindowAddEventListener).not.toBe(state.originalDocumentAddEventListener)
  })

  test('document add event listener is replaced', () => {
    const originalDocumentListener = window.addEventListener
    const state = new ListenerState(window as unknown as Window, document)
    expect(state.originalDocumentAddEventListener).not.toBe(originalDocumentListener)
  })

  test('window add event listener is replaced', () => {
    const originalWindowListener = window.addEventListener
    const state = new ListenerState(window as unknown as Window, document)
    expect(state.originalWindowAddEventListener).not.toBe(originalWindowListener)
  })
})

describe('isListenerStateInstance happy path', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('isListenerStateInstance returns true for valid ListenerState instance', () => {
    const state = new ListenerState(window as unknown as Window, document)
    expect(isListenerStateInstance(state)).toBeTruthy()
  })
})

describe('isListenerStateInstance negative case', () => {
  test('isListenerStateInstance returns false for empty object literal', () => {
    expect(isListenerStateInstance({})).toBeFalsy()
  })
})

describe('addEventListenerToTracking works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('adds valid document event listener to tracker', () => {
    const state = new ListenerState(window as unknown as Window, document)
    state.addEventListenerToTracking(`click`, listener)
    expect(state.getEventListenerRefsCount()).toBe(1)
  })
})

describe('resetEventListenerTracking works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('removes event listeners and resets event listener tracking', () => {
    const listenerMock = jest.fn(() => undefined)

    const cb: removalCb = ({ type, listener, options }) => {
      document.removeEventListener(type, listener, options)
    }

    const state = new ListenerState(window as unknown as Window, document)
    document.addEventListener(`click`, listenerMock)
    // simulate JSDOM custom env where addEventListener is wrapped to add ref to state
    state.addEventListenerToTracking(`click`, listenerMock)
    expect(state.getEventListenerRefsCount()).toBe(1)
    // sanity check
    document.querySelector('body')!.click()
    expect(listenerMock.mock.calls).toHaveLength(1)
    // sut
    state.resetEventListenerTracking(cb)
    document.querySelector('body')!.click()
    expect(listenerMock.mock.calls).toHaveLength(1)
    expect(state.getEventListenerRefsCount()).toBe(0)
  })
})

describe('callOriginalAddEventListener works for window object', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('calls original window event listener mock', () => {
    const addEventListenerMock = jest.fn()
    window.addEventListener = addEventListenerMock
    const state = new ListenerState(window as unknown as Window, document)
    state.callOriginalAddEventListener(`window`, { type: `click`, listener })
    expect(addEventListenerMock.mock.calls).toHaveLength(1)
  })

  test('calls original document event listener mock', () => {
    const addEventListenerMock = jest.fn()
    document.addEventListener = addEventListenerMock
    const state = new ListenerState(window as unknown as Window, document)
    state.callOriginalAddEventListener(`document`, { type: `click`, listener })
    expect(addEventListenerMock.mock.calls).toHaveLength(1)
  })
})

describe('filterTrackedGlobalProperties works', () => {
  let window: DOMWindow
  let document: Document

  beforeEach(() => {
    const dom = new JSDOM()
    window = dom.window
    document = window.document
  })

  test('it does not filter custom properties added to window', () => {
    const state = new ListenerState(window as unknown as Window, document)
    const sut = [`customProp`].filter(state.filterTrackedGlobalProperties(`window`))
    expect(sut).toContain(`customProp`)
  })

  test('it does not filter custom properties added to document', () => {
    const state = new ListenerState(window as unknown as Window, document)
    const sut = [`customProp`].filter(state.filterTrackedGlobalProperties(`document`))
    expect(sut).toContain(`customProp`)
  })

  test('it filters addEventListener properties added to window', () => {
    const state = new ListenerState(window as unknown as Window, document)
    const sut = [`addEventListener`].filter(state.filterTrackedGlobalProperties(`window`))
    expect(sut).not.toContain(`addEventListener`)
  })

  test('it filters addEventListener properties added to document', () => {
    const state = new ListenerState(window as unknown as Window, document)
    const sut = [`addEventListener`].filter(state.filterTrackedGlobalProperties(`document`))
    expect(sut).not.toContain(`addEventListener`)
  })

  test('it filters well known addEventListener properties added to window', () => {
    const state = new ListenerState(window as unknown as Window, document)
    const sut = [`onerror`].filter(state.filterTrackedGlobalProperties(`window`))
    expect(sut).not.toContain(`onerror`)
  })
})
