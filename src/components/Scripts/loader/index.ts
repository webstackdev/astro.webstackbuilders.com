/**
 * Generic event-driven loader for component scripts.
 * Manages script initialization based on various DOM and user interaction events.
 * Supports delayed execution to optimize performance metrics like LCP (Largest Contentful Paint).
 *
 * Features:
 * - Automatic pause/resume based on document visibility changes
 * - Event-driven script execution (DOM ready, user interaction, etc.)
 * - Singleton pattern for centralized script management
 */

import type { UserInteractionEvent, TriggerEvent, LoadableScript } from './@types/loader'

export const userInteractionEvents: UserInteractionEvent[] = [
  'keydown',
  'mousemove',
  'wheel',
  'touchmove',
  'touchstart',
  'touchend'
]

/**
 * The maximum period of time in milliseconds that execution should delay while
 * waiting for user interaction.
 */
/** Duration before automatically executing scripts (5 seconds) */
export const autoLoadDuration = 5000

/** @deprecated Use userInteractionEvents instead */
export const eventList = userInteractionEvents

// Re-export types for convenience
export type { UserInteractionEvent, TriggerEvent, LoadableScript }

/**
 * Generic singleton class that manages component script execution based on various trigger events.
 * Supports immediate execution, delayed execution, and DOM event-based execution.
 */
class Loader {
  private static instance: Loader | null = null
  private eventQueues: Map<TriggerEvent, Array<LoadableScript>> = new Map()
  private executedEvents: Set<TriggerEvent> = new Set()
  private executedScripts: Set<LoadableScript> = new Set()
  private timeoutID: number | null = null
  private isDelayedInitialized = false
  private isVisibilityListenerInitialized = false

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.initializeDOMEventListeners()
    this.initializeVisibilityListener()
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): Loader {
    if (!Loader.instance) {
      Loader.instance = new Loader()
    }
    return Loader.instance
  }

  /**
   * Register a script to be executed when its trigger event occurs
   * @param script - The script to register
   */
  public registerScript(script: LoadableScript): void {
    const eventType = script.getEventType()

    if (this.executedEvents.has(eventType)) {
      // Event already fired, execute immediately
      this.executeScript(script)
      return
    }

    // Add to queue for this event type
    if (!this.eventQueues.has(eventType)) {
      this.eventQueues.set(eventType, [])
    }
    this.eventQueues.get(eventType)!.push(script)

    // Special handling for delayed execution
    if (eventType === 'delayed' && !this.isDelayedInitialized) {
      this.initializeDelayedExecution()
    }
  }

  /**
   * Initialize DOM event listeners for supported events
   */
  private initializeDOMEventListeners(): void {
    const domEvents: TriggerEvent[] = [
      'DOMContentLoaded',
      'load',
      'beforeunload',
      'astro:before-preparation',
      'astro:after-preparation',
      'astro:before-swap',
      'astro:after-swap',
      'astro:page-load'
    ]

    domEvents.forEach(eventType => {
      const listener = () => this.executeEvent(eventType)

      if (eventType.startsWith('astro:')) {
        document.addEventListener(eventType, listener, { once: true })
      } else {
        if (eventType === 'DOMContentLoaded' && document.readyState !== 'loading') {
          // DOM already loaded
          this.executeEvent(eventType)
        } else if (eventType === 'load' && document.readyState === 'complete') {
          // Page already loaded
          this.executeEvent(eventType)
        } else {
          document.addEventListener(eventType, listener, { once: true })
        }
      }
    })
  }

  /**
   * Initialize delayed execution with user interaction detection
   */
  private initializeDelayedExecution(): void {
    this.isDelayedInitialized = true

    const userInteractionListener = (event: Event) => {
      this.executeEvent('delayed')
      this.removeUserInteractionListeners(event.type as UserInteractionEvent)
    }

    // Set timeout for auto-execution
    this.timeoutID = window.setTimeout(() => {
      this.executeEvent('delayed')
      this.removeUserInteractionListeners()
    }, autoLoadDuration)

    // Add user interaction listeners
    const listenerOptions = { once: true, passive: true }
    userInteractionEvents.forEach(eventName => {
      document.addEventListener(eventName, userInteractionListener, listenerOptions)
    })
  }

  /**
   * Remove user interaction event listeners
   * @param skipEvent - Optional event type to skip removal
   */
  private removeUserInteractionListeners(skipEvent?: UserInteractionEvent): void {
  userInteractionEvents
    .filter(_eventName => _eventName !== skipEvent)
    .forEach(_eventName => {
      // Note: We can't remove the exact listener without a reference, but since
      // we use { once: true }, they'll be automatically removed after firing
    })    // Clear timeout if it exists
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID)
      this.timeoutID = null
    }
  }

  /**
   * Initialize visibility change listener for pause/resume functionality
   */
  private initializeVisibilityListener(): void {
    if (this.isVisibilityListenerInitialized) {
      return
    }

    this.isVisibilityListenerInitialized = true

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Resume all executed scripts
        this.executedScripts.forEach(script => {
          try {
            script.resume()
          } catch (error) {
            console.error(`Error resuming script ${script.constructor.name}:`, error)
          }
        })
      } else {
        // Pause all executed scripts
        this.executedScripts.forEach(script => {
          try {
            script.pause()
          } catch (error) {
            console.error(`Error pausing script ${script.constructor.name}:`, error)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  /**
   * Execute all scripts registered for a specific event
   * @param eventType - The event type to execute
   */
  private executeEvent(eventType: TriggerEvent): void {
    if (this.executedEvents.has(eventType)) {
      return // Already executed
    }

    this.executedEvents.add(eventType)

    const queue = this.eventQueues.get(eventType)
    if (!queue || queue.length === 0) {
      return
    }

    // Execute all scripts in the queue
    queue.forEach(script => {
      this.executeScript(script)
    })

    // Clear the queue
    this.eventQueues.delete(eventType)
  }

  /**
   * Execute a script with error handling and logging
   * @param script - The script to execute
   */
  private executeScript(script: LoadableScript): void {
    try {
      script.init()
      // Track executed scripts for pause/resume functionality
      this.executedScripts.add(script)
      console.log(`Script initialized: ${script.constructor.name}`)
    } catch (error) {
      console.error(`Error initializing script ${script.constructor.name}:`, error)
      // TODO: Add Sentry error reporting here
    }
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static reset(): void {
    if (Loader.instance) {
      if (Loader.instance.timeoutID !== null) {
        clearTimeout(Loader.instance.timeoutID)
      }
      // Clear executed scripts tracking
      Loader.instance.executedScripts.clear()
      Loader.instance = null
    }
  }
}

/**
 * Register a script to be executed when its trigger event occurs
 * @param script - The script to register
 */
export const registerScript = (script: LoadableScript): void => {
  const loader = Loader.getInstance()
  loader.registerScript(script)
}

/**
 * Reset the loader (useful for testing)
 */
export const resetDelayedLoader = (): void => {
  Loader.reset()
}
