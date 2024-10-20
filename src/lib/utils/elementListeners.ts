/**
 * Cookie consent modal event listeners
 */
type eventHandler = (event: Event) => void

const getClickEventListener = (handler: eventHandler) => {
  function clickListener (event: MouseEvent) {
    if (event.type === `click`) handler(event)
  }
  return clickListener
}

const getEnterKeyEventListener = (handler: eventHandler) => {
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
  function touchendEventHandler (event: TouchEvent) {
    if (event.type === `touchend`) handler(event)
  }
  return touchendEventHandler
}

const getEscapeKeyEventListener = (handler: eventHandler) => {
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
