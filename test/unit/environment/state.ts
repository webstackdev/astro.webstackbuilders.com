/**
 * Data structure to maintain state of JSDom 'document' and 'window' objects between tests
 */
export type NodeMapper = { document: Document; window: Window }

export type NodeName = keyof NodeMapper

export type EventListenerRecord = {
  type: string
  listener: EventListenerOrEventListenerObject
  options?: boolean | AddEventListenerOptions
}

export type removalCb = ({ type, listener, options }: EventListenerRecord) => void
type removalCbs = removalCb | removalCb[]

export function isListenerStateInstance(input: unknown): input is ListenerState {
  const isDefined = !!input
  const isInstanceOf = input instanceof ListenerState
  if (isDefined && isInstanceOf) return true
  return false
}

export const getState = (): ListenerState => {
  const state = globalThis.EVENT_LISTENER_STATE
  if (!isListenerStateInstance(state)) {
    throw new Error(`Global event listener state not a valid instance of ListenerState`)
  }
  return state
}

export class ListenerState {
  private eventListenerRefs: EventListenerRecord[] = []
  private trackedWindowProperties: string[]
  private trackedDocumentProperties: string[]
  public originalWindowAddEventListener: Window['addEventListener']
  public originalDocumentAddEventListener: Document['addEventListener']
  public nodeNames: NodeName[]
  private errorListenerCount: number
  public instanceToken: boolean

  constructor(window: Window, document: Document) {
    /** Initialize tracked keys that should not be removed from global objects during reset */
    this.trackedWindowProperties = Object.keys(window)
    this.trackedDocumentProperties = Object.keys(document)
    /** Cache bound original event listeners */
    this.originalWindowAddEventListener = window.addEventListener.bind(window)
    this.originalDocumentAddEventListener = document.addEventListener.bind(document)
    /** Global objects to manage */
    this.nodeNames = ['document', 'window']
    this.errorListenerCount = 0
    /** Always last */
    this.instanceToken = true
  }

  /** Enable instanceof checks across realms and into Jest's VM for object instances */
  static [Symbol.hasInstance](instance: unknown) {
    return (
      instance &&
      typeof instance === 'object' &&
      (instance as ListenerState)['instanceToken' as keyof ListenerState]
    )
  }

  getErrorListenerCount() {
    return this.errorListenerCount
  }

  decrementErrorListenerCount() {
    this.errorListenerCount--
  }

  incrementErrorListenerCount() {
    this.errorListenerCount++
  }

  /** Store listener referencewhen added so it can be removed during reset */
  addEventListenerToTracking = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    this.eventListenerRefs.push({ type, listener, options })
    this.incrementErrorListenerCount()
  }

  getEventListenerRefsCount() {
    return this.eventListenerRefs.length
  }

  resetEventListenerTracking(cb: removalCbs) {
    const cbArr = Array.isArray(cb) ? cb : [cb]
    while (this.getEventListenerRefsCount()) {
      const ref = this.eventListenerRefs.pop()! // pop() widens type to include 'undefined'
      cbArr.forEach(callback => callback(ref))
    }
  }

  callOriginalAddEventListener(
    nodeName: NodeName,
    { type, listener, options }: EventListenerRecord
  ) {
    if (nodeName === `document`) {
      this.originalDocumentAddEventListener(type, listener, options)
    } else {
      this.originalWindowAddEventListener(type, listener, options)
    }
  }

  /**
   * Array filter callback to check if a given key on the 'window' or 'document' global
   * objects should be ignored as keys are removed in cleanup, because it is tracked here
   */
  filterTrackedGlobalProperties(nodeName: NodeName) {
    return (key: string) => {
      if (
        /** addEventListener not returned from Object.keys(window) */
        key === `addEventListener` ||
        /** Don't remove the state object from globals */
        key === `EVENT_LISTENER_STATE` ||
        key === `WORKER_POOL` ||
        (nodeName === `window` && this.trackedWindowProperties.includes(key)) ||
        (nodeName === `document` && this.trackedDocumentProperties.includes(key))
      ) {
        return false
      }
      return true
    }
  }
}
