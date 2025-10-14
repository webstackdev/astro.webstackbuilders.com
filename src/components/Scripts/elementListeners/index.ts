/**
 * Element event listeners utility
 * Provides standardized event listener attachment with accessibility support
 */
type eventHandler = (_event: Event) => void

const getClickEventListener = (handler: eventHandler) => {
  /**
   * Click event listener wrapper
   * @param event - Mouse event
   */
  function clickListener (event: MouseEvent) {
    if (event.type === `click`) handler(event)
  }
  return clickListener
}

const getEnterKeyEventListener = (handler: eventHandler) => {
  /**
   * Enter key event listener wrapper
   * @param event - Keyboard event
   */
  function keypressListener (event: KeyboardEvent) {
    /**
     * isComposing indicates that an Input-Method Editor is composing text, such as
     * when a CMYK character is being composed or a virtual keyboard is accepting
     * handwritten input for recognition. Also protect against this being called for
     * `keydown` event and a key being held down.
     */
    if (event.isComposing || event.repeat) return
    if (event.key === `Enter`) handler(event)
  }
  return keypressListener
}

const getTouchendEventListener = (handler: eventHandler) => {
  /**
   * Touch end event listener wrapper
   * @param event - Touch event
   */
  function touchendEventHandler (event: TouchEvent) {
    if (event.type === `touchend`) handler(event)
  }
  return touchendEventHandler
}

const getEscapeKeyEventListener = (handler: eventHandler) => {
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
    if (event.key === `Escape`) handler(event)
  }
  return keypressListener
}

export const addButtonEventListeners = (element: HTMLButtonElement, handler: eventHandler) => {
  element.addEventListener(`click`, getClickEventListener(handler))
  element.addEventListener(`keyup`, getEnterKeyEventListener(handler))
  element.addEventListener(`touchend`, getTouchendEventListener(handler))
}

export const addLinkEventListeners = (element: HTMLAnchorElement, handler: eventHandler) => {
  element.addEventListener(`click`, getClickEventListener(handler))
  element.addEventListener(`keyup`, getEnterKeyEventListener(handler))
  element.addEventListener(`touchend`, getTouchendEventListener(handler))
}

export const addWrapperEventListeners = (element: HTMLDivElement, handler: eventHandler) => {
  element.addEventListener(`keyup`, getEscapeKeyEventListener(handler))
}

// Export the type for external use
export type { eventHandler }