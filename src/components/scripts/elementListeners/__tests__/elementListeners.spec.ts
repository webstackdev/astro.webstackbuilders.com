// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import {
  addButtonEventListeners,
  addLinkEventListeners,
  addWrapperEventListeners,
  type eventHandler,
} from '@components/scripts/elementListeners/index'

const createTouchEndEvent = (): TouchEvent => {
  if (typeof TouchEvent === 'function') {
    return new TouchEvent('touchend', {
      touches: [],
      targetTouches: [],
      changedTouches: [],
    })
  }

  const fallbackEvent = new Event('touchend') as TouchEvent & {
    touches: TouchList & Touch[]
    targetTouches: TouchList & Touch[]
    changedTouches: TouchList & Touch[]
  }
  const emptyTouches = [] as unknown as TouchList & Touch[]

  fallbackEvent.touches = emptyTouches
  fallbackEvent.targetTouches = emptyTouches
  fallbackEvent.changedTouches = emptyTouches

  return fallbackEvent
}

describe('Element Listeners', () => {
  let mockHandler: MockedFunction<eventHandler>

  beforeEach(() => {
    mockHandler = vi.fn()
    document.body.innerHTML = ''
  })

  describe('addButtonEventListeners', () => {
    let button: HTMLButtonElement

    beforeEach(() => {
      button = document.createElement('button')
      button.textContent = 'Test Button'
      document.body.appendChild(button)
    })

    it('should attach click event listener', () => {
      addButtonEventListeners(button, mockHandler)

      button.click()

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      )
    })

    it('should attach keyup event listener for Enter key', () => {
      addButtonEventListeners(button, mockHandler)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' })
      button.dispatchEvent(enterEvent)

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(enterEvent)
    })

    it('should not trigger on other keys', () => {
      addButtonEventListeners(button, mockHandler)

      const spaceEvent = new KeyboardEvent('keyup', { key: ' ' })
      button.dispatchEvent(spaceEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should not trigger on composing input', () => {
      addButtonEventListeners(button, mockHandler)

      const composingEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        isComposing: true,
      })
      button.dispatchEvent(composingEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should not trigger on repeated key events', () => {
      addButtonEventListeners(button, mockHandler)

      const repeatEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        repeat: true,
      })
      button.dispatchEvent(repeatEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should attach touchend event listener', () => {
      addButtonEventListeners(button, mockHandler)

      const touchEvent = createTouchEndEvent()
      button.dispatchEvent(touchEvent)

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(touchEvent)
    })

    it('should handle multiple event types on same element', () => {
      addButtonEventListeners(button, mockHandler)

      // Click event
      button.click()

      // Enter key event
      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' })
      button.dispatchEvent(enterEvent)

      // Touch event
      const touchEvent = createTouchEndEvent()
      button.dispatchEvent(touchEvent)

      expect(mockHandler).toHaveBeenCalledTimes(3)
    })
  })

  describe('addLinkEventListeners', () => {
    let link: HTMLAnchorElement

    beforeEach(() => {
      link = document.createElement('a')
      link.href = '#'
      link.textContent = 'Test Link'
      document.body.appendChild(link)
    })

    it('should attach click event listener', () => {
      addLinkEventListeners(link, mockHandler)

      link.click()

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      )
    })

    it('should attach keyup event listener for Enter key', () => {
      addLinkEventListeners(link, mockHandler)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' })
      link.dispatchEvent(enterEvent)

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(enterEvent)
    })

    it('should not trigger on other keys', () => {
      addLinkEventListeners(link, mockHandler)

      const tabEvent = new KeyboardEvent('keyup', { key: 'Tab' })
      link.dispatchEvent(tabEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should attach touchend event listener', () => {
      addLinkEventListeners(link, mockHandler)

      const touchEvent = createTouchEndEvent()
      link.dispatchEvent(touchEvent)

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(touchEvent)
    })

    it('should handle multiple event types on same element', () => {
      addLinkEventListeners(link, mockHandler)

      // Click event
      link.click()

      // Enter key event
      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' })
      link.dispatchEvent(enterEvent)

      // Touch event
      const touchEvent = createTouchEndEvent()
      link.dispatchEvent(touchEvent)

      expect(mockHandler).toHaveBeenCalledTimes(3)
    })
  })

  describe('addWrapperEventListeners', () => {
    let wrapper: HTMLDivElement

    beforeEach(() => {
      wrapper = document.createElement('div')
      wrapper.className = 'wrapper'
      document.body.appendChild(wrapper)
    })

    it('should attach keyup event listener for Escape key', () => {
      addWrapperEventListeners(wrapper, mockHandler)

      const escapeEvent = new KeyboardEvent('keyup', { key: 'Escape' })
      wrapper.dispatchEvent(escapeEvent)

      expect(mockHandler).toHaveBeenCalledOnce()
      expect(mockHandler).toHaveBeenCalledWith(escapeEvent)
    })

    it('should not trigger on other keys', () => {
      addWrapperEventListeners(wrapper, mockHandler)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' })
      wrapper.dispatchEvent(enterEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should not trigger on composing input', () => {
      addWrapperEventListeners(wrapper, mockHandler)

      const composingEvent = new KeyboardEvent('keyup', {
        key: 'Escape',
        isComposing: true,
      })
      wrapper.dispatchEvent(composingEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should not trigger on repeated key events', () => {
      addWrapperEventListeners(wrapper, mockHandler)

      const repeatEvent = new KeyboardEvent('keyup', {
        key: 'Escape',
        repeat: true,
      })
      wrapper.dispatchEvent(repeatEvent)

      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('Event Handler Integration', () => {
    it('should properly pass through event objects', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)

      addButtonEventListeners(button, mockHandler)

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
      button.dispatchEvent(clickEvent)

      expect(mockHandler).toHaveBeenCalledWith(clickEvent)
      expect(mockHandler.mock.calls[0]?.[0]).toBe(clickEvent)
    })

    it('should call event handlers and allow them to execute normally', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)

      let handlerExecuted = false
      const handler = vi.fn(() => {
        handlerExecuted = true
      })

      // Add the event listener
      addButtonEventListeners(button, handler)

      // Click the button
      button.click()

      expect(handler).toHaveBeenCalledOnce()
      expect(handlerExecuted).toBe(true)
    })
  })

  describe('Accessibility Features', () => {
    it('should support keyboard navigation patterns', () => {
      const button = document.createElement('button')
      const link = document.createElement('a')
      const wrapper = document.createElement('div')

      document.body.appendChild(button)
      document.body.appendChild(link)
      document.body.appendChild(wrapper)

      const buttonHandler = vi.fn()
      const linkHandler = vi.fn()
      const wrapperHandler = vi.fn()

      addButtonEventListeners(button, buttonHandler)
      addLinkEventListeners(link, linkHandler)
      addWrapperEventListeners(wrapper, wrapperHandler)

      // Simulate keyboard navigation
      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' })
      const escapeEvent = new KeyboardEvent('keyup', { key: 'Escape' })

      button.dispatchEvent(enterEvent)
      link.dispatchEvent(enterEvent)
      wrapper.dispatchEvent(escapeEvent)

      expect(buttonHandler).toHaveBeenCalledWith(enterEvent)
      expect(linkHandler).toHaveBeenCalledWith(enterEvent)
      expect(wrapperHandler).toHaveBeenCalledWith(escapeEvent)
    })

    it('should support touch interactions', () => {
      const button = document.createElement('button')
      const link = document.createElement('a')

      document.body.appendChild(button)
      document.body.appendChild(link)

      const buttonHandler = vi.fn()
      const linkHandler = vi.fn()

      addButtonEventListeners(button, buttonHandler)
      addLinkEventListeners(link, linkHandler)

      const touchEvent = createTouchEndEvent()

      button.dispatchEvent(touchEvent)
      link.dispatchEvent(touchEvent)

      expect(buttonHandler).toHaveBeenCalledWith(touchEvent)
      expect(linkHandler).toHaveBeenCalledWith(touchEvent)
    })
  })
})
