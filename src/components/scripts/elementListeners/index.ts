/**
 * Element event listeners utility
 * Provides standardized event listener attachment with accessibility support
 * Supports both regular functions and web component methods with 'this' context
 */

type eventHandler = (this: unknown, _event: Event) => void

const getClickEventListener = (handler: eventHandler, context?: unknown) => {
  /**
   * Click event listener wrapper
   * @param event - Mouse event
   */
  function clickListener(event: MouseEvent) {
    if (event.type === `click`) handler.call(context, event)
  }
  return clickListener
}

const getEnterKeyEventListener = (handler: eventHandler, context?: unknown) => {
  /**
   * Enter key event listener wrapper
   * @param event - Keyboard event
   */
  function keypressListener(event: KeyboardEvent) {
    /**
     * isComposing indicates that an Input-Method Editor is composing text, such as
     * when a CMYK character is being composed or a virtual keyboard is accepting
     * handwritten input for recognition. Also protect against this being called for
     * `keydown` event and a key being held down.
     */
    if (event.isComposing || event.repeat) return
    if (event.key === `Enter`) handler.call(context, event)
  }
  return keypressListener
}

const getTouchendEventListener = (handler: eventHandler, context?: unknown) => {
  /**
   * Touch end event listener wrapper
   * @param event - Touch event
   */
  function touchendEventHandler(event: TouchEvent) {
    if (event.type !== `touchend`) return
    if (event.cancelable && !event.defaultPrevented) {
      event.preventDefault()
    }
    handler.call(context, event)
  }
  return touchendEventHandler
}

const getEscapeKeyEventListener = (handler: eventHandler, context?: unknown) => {
  /**
   * Escape key event listener wrapper
   * @param event - Keyboard event
   */
  function keypressListener(event: KeyboardEvent) {
    /**
     * isComposing indicates that an Input-Method Editor is composing text, such as
     * when a CMYK character is being composed or a virtual keyboard is accepting
     * handwritten input for recognition. Also protect against this being called for
     * `keydown` event and a key being held down.
     */
    if (event.isComposing || event.repeat) return
    if (event.key === `Escape`) handler.call(context, event)
  }
  return keypressListener
}

export const addButtonEventListeners = (
  element: HTMLButtonElement,
  handler: eventHandler,
  context?: unknown
) => {
  element.addEventListener(`click`, getClickEventListener(handler, context))
  // Native <button> elements already trigger click events for keyboard interaction
  // so we deliberately skip binding Enter listeners to avoid duplicate handlers
  element.addEventListener(`touchend`, getTouchendEventListener(handler, context), {
    passive: false,
  })
}

export const addLinkEventListeners = (
  element: HTMLAnchorElement,
  handler: eventHandler,
  context?: unknown
) => {
  element.addEventListener(`click`, getClickEventListener(handler, context))
  element.addEventListener(`keyup`, getEnterKeyEventListener(handler, context))
  element.addEventListener(`touchend`, getTouchendEventListener(handler, context), {
    passive: false,
  })
}

export const addWrapperEventListeners = (
  element: HTMLElement,
  handler: eventHandler,
  context?: unknown
) => {
  element.addEventListener(`keyup`, getEscapeKeyEventListener(handler, context))
}

// Export the type for external use
export type { eventHandler }
