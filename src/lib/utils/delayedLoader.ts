/**
 * Waits for user interaction by pressing the key, moving a mouse or touching
 * the screen. Useful for cookie consent banners to avoid LCP hit on Lighthouse.
 * If no user interaction occurs within the auto load duration, triggers action.
 */

/** The events that qualify as user interaction and should trigger executing the action. */
type EventList = 'keydown' | 'mousemove' | 'wheel' | 'touchmove' | 'touchstart' | 'touchend'
export const eventList: EventList[] = ['keydown', 'mousemove', 'wheel', 'touchmove', 'touchstart', 'touchend']

/**
 * The maximum period of time in seconds that execution should delay while
 * waiting for user interaction.
 */
export const autoLoadDuration = 5 * 1000

// @TODO: how to prevent a race condition of two events both trying to handle this procedure? Or the timeout and an event listener racing?

/**
 * Run a list of scripts after a delay if no user interaction has occurred
 */
export const addDelayedExecutionScripts = (scriptsFiredOnUserInteraction: typeof ScriptInit[]) => {
  const runScripts = () => scriptsFiredOnUserInteraction.forEach(script => script())

  function userInteractionListener(event: Event) {
    /** The event listener should cancel the timeout. */
    clearTimeout(timeoutID)
    /** remove **unfired** event listeners from the list of user interaction events. */
    removeEventListeners(event.type as EventList)
    runScripts()
  }

  // @TODO: circular reference here with 'userInteractionListener' and 'removeEventListeners'
  function removeEventListeners(skipEvent?: EventList) {
    function removeItem(eventName: EventList) {
      document.removeEventListener(eventName, userInteractionListener, { capture: false })
    }
    eventList.filter(eventName => eventName !== skipEvent).forEach(removeItem)
  }

  /** Set a timeout for the set duration. Run the passed array of scripts after the timeout expires. */
  const timeoutCb = () => {
    /** Remove **all** event listeners from the list of user interaction events. */
    removeEventListeners()
    runScripts()
  }
  const timeoutID = setTimeout(timeoutCb, autoLoadDuration)

  /** Attach event listeners to all of the user interaction events in the list. */
  const listenerOptions = { once: true, passive: true }
  eventList.forEach(eventName => {
    document.addEventListener(eventName, userInteractionListener, listenerOptions)
  })
}
