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

/** Type for script initialization functions */
type ScriptInit = () => void

/**
 * Singleton class that manages delayed script execution.
 * Ensures only one set of event listeners is active and all registered scripts
 * run together on the first user interaction or timeout.
 */
class DelayedLoader {
  private static instance: DelayedLoader | null = null
  private scripts: ScriptInit[] = []
  private timeoutID: number | null = null
  private isExecuted = false
  private isInitialized = false

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): DelayedLoader {
    if (!DelayedLoader.instance) {
      DelayedLoader.instance = new DelayedLoader()
    }
    return DelayedLoader.instance
  }

  /**
   * Register scripts to be executed on user interaction or timeout
   * @param scriptsFiredOnUserInteraction - Array of functions to execute
   */
  public registerScripts(scriptsFiredOnUserInteraction: ScriptInit[]): void {
    if (this.isExecuted) {
      // If scripts have already been executed, run new scripts immediately
      scriptsFiredOnUserInteraction.forEach(script => script())
      return
    }

    this.scripts.push(...scriptsFiredOnUserInteraction)

    // Initialize listeners only once
    if (!this.isInitialized) {
      this.initialize()
    }
  }

  /**
   * Initialize event listeners and timeout
   */
  private initialize(): void {
    this.isInitialized = true

    /**
     * Event handler for user interaction events
     * @param event - The user interaction event
     */
    const userInteractionListener = (event: Event) => {
      this.executeScripts()
      this.removeEventListeners(event.type as EventList)
    }

    /**
     * Remove event listeners from the document
     * @param skipEvent - Optional event type to skip removal
     */
    const removeEventListeners = (skipEvent?: EventList) => {
      /**
       * Remove a specific event listener
       * @param eventName - The event name to remove
       */
      const removeItem = (eventName: EventList) => {
        document.removeEventListener(eventName, userInteractionListener, { capture: false })
      }
      eventList.filter(eventName => eventName !== skipEvent).forEach(removeItem)
    }

    // Store reference for use in methods
    this.removeEventListeners = removeEventListeners

    /** Set a timeout for the set duration. Run all registered scripts after the timeout expires. */
    const timeoutCb = () => {
      this.executeScripts()
      removeEventListeners()
    }
    this.timeoutID = window.setTimeout(timeoutCb, autoLoadDuration)

    /** Attach event listeners to all of the user interaction events in the list. */
    const listenerOptions = { once: true, passive: true }
    eventList.forEach(eventName => {
      document.addEventListener(eventName, userInteractionListener, listenerOptions)
    })
  }

  /**
   * Execute all registered scripts
   */
  private executeScripts(): void {
    if (this.isExecuted) {
      return
    }

    this.isExecuted = true

    // Cancel the timeout if it exists
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID)
      this.timeoutID = null
    }

    // Execute all registered scripts
    this.scripts.forEach(script => script())
  }

  /**
   * Remove event listeners (will be assigned in initialize)
   */
  private removeEventListeners: (_skipEvent?: EventList) => void = () => {
    // Placeholder function, will be replaced in initialize()
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static reset(): void {
    if (DelayedLoader.instance) {
      if (DelayedLoader.instance.timeoutID !== null) {
        clearTimeout(DelayedLoader.instance.timeoutID)
      }
      DelayedLoader.instance = null
    }
  }
}

/**
 * Register scripts to be executed after a delay if no user interaction has occurred.
 * Uses a singleton pattern to ensure only one set of event listeners is active.
 * Multiple calls will add scripts to a shared queue that executes together.
 * @param scriptsFiredOnUserInteraction - Array of functions to execute
 */
export const addDelayedExecutionScripts = (scriptsFiredOnUserInteraction: ScriptInit[]): void => {
  const loader = DelayedLoader.getInstance()
  loader.registerScripts(scriptsFiredOnUserInteraction)
}

/**
 * Reset the delayed loader (useful for testing)
 */
export const resetDelayedLoader = (): void => {
  DelayedLoader.reset()
}
