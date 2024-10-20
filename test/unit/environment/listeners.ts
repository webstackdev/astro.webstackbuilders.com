/// <reference path="../@types/global.jsdom.d.ts" />
import { getState } from '../environment/state'
import type JSDomTscompileEnvironment from '../environment/browser-env'

/**
 * Default behavior for error events if client error handler not provided.
 */
export const errorEventListener = (event: Event & { error: Error }) => {
  /* eslint-disable-next-line no-null/no-null */
  if (getState().getErrorListenerCount() === 0 && event.error !== null) {
    process.emit('uncaughtException', event.error)
  }
}

/**
 * Environment constructor wraps JSDOM's add and remove event
 * handler methos for 'window' and 'document' objects.
 */
export function wrapWindowAddEventListener(
  this: JSDomTscompileEnvironment,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions | undefined
) {
  /** Used by error event listener added in environment */
  if (type === 'error') getState().incrementErrorListenerCount()
  /** Store listener reference on addEventListener call so it can be removed during reset */
  getState().addEventListenerToTracking(type, listener, options)
  /** Call original window or document global addEventListener */
  getState().callOriginalAddEventListener(`window`, { type, listener, options })
  return this.eventListenerState.originalWindowAddEventListener.apply(this, [
    type,
    listener,
    options,
  ])
}

export function wrapDocumentAddEventListener(
  this: JSDomTscompileEnvironment,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions | undefined
) {
  /** Used by error event listener added in environment */
  if (type === 'error') getState().incrementErrorListenerCount()
  /** Store listener reference on addEventListener call so it can be removed during reset */
  getState().addEventListenerToTracking(type, listener, options)
  /** Call original window or document global addEventListener */
  getState().callOriginalAddEventListener(`window`, { type, listener, options })
  return this.eventListenerState.originalDocumentAddEventListener.apply(this, [
    type,
    listener,
    options,
  ])
}
