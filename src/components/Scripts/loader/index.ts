/**
 * Generic event-driven loader for component scripts.
 * Manages script initialization based on various DOM and user interaction events.
 * Supports delayed execution to optimize performance metrics like LCP (Largest Contentful Paint).
 *
 * Features:
 * - Automatic pause/resume based on document visibility changes
 * - Event-driven script execution (DOM ready, user interaction, etc.)
 * - Singleton pattern for centralized script management
 * - Consent-gated script loading with automatic reload on consent change
 */

import { LoadableScript } from './@types/loader'
import type { UserInteractionEvent, TriggerEvent, ConsentMetadata } from './@types/loader'
import {
  $hasAnalyticsConsent,
  $hasAdvertisingConsent,
  $hasFunctionalConsent,
} from '@components/Scripts/state'
import type { ConsentCategory } from '@components/Scripts/state'

export const userInteractionEvents: UserInteractionEvent[] = [
  'keydown',
  'mousemove',
  'wheel',
  'touchmove',
  'touchstart',
  'touchend',
]

/**
 * The maximum period of time in milliseconds that execution should delay while
 * waiting for user interaction.
 */
/** Duration before automatically executing scripts (5 seconds) */
export const autoLoadDuration = 5000

/** @deprecated Use userInteractionEvents instead */
export const eventList = userInteractionEvents

// Re-export types and the LoadableScript class for convenience
export type { UserInteractionEvent, TriggerEvent, ConsentMetadata }
export { LoadableScript }

/**
 * Generic singleton class that manages component script execution based on various trigger events.
 * Supports immediate execution, delayed execution, and DOM event-based execution.
 */
class Loader {
  private static instance: Loader | null = null
  private eventQueues: Map<TriggerEvent, Array<typeof LoadableScript>> = new Map()
  private executedEvents: Set<TriggerEvent> = new Set()
  private executedScripts: Set<typeof LoadableScript> = new Set()
  private timeoutID: number | null = null
  private isDelayedInitialized = false
  private isVisibilityListenerInitialized = false
  private intersectionObserver: IntersectionObserver | null = null
  private observedElements: Map<Element, Array<typeof LoadableScript>> = new Map()
  private consentUnsubscribers: Map<string, () => void> = new Map()
  private consentGatedScripts: Map<ConsentCategory, Set<typeof LoadableScript>> = new Map()

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.initializeDOMEventListeners()
    this.initializeVisibilityListener()
    this.initializeIntersectionObserver()
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
  public registerScript(script: typeof LoadableScript): void {
    const eventType = script.eventType

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

    // Special handling for visible event
    if (eventType === 'visible') {
      this.initializeVisibleEvent(script)
    }

    // Special handling for consent-gated scripts
    if (eventType === 'consent-gated') {
      this.initializeConsentGatedExecution(script)
    }
  }

  /**
   * Initialize DOM event listeners for supported events
   */
  private initializeDOMEventListeners(): void {
    const domEvents: TriggerEvent[] = [
      'astro:before-preparation',
      'astro:after-preparation',
      'astro:before-swap',
      'astro:after-swap',
      'astro:page-load',
    ]

    domEvents.forEach(eventType => {
      const listener = () => this.executeEvent(eventType)
      document.addEventListener(eventType, listener, { once: true })
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
      }) // Clear timeout if it exists
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID)
      this.timeoutID = null
    }
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
  private executeScript(script: typeof LoadableScript): void {
    try {
      script.init()
      // Track executed scripts for pause/resume functionality
      this.executedScripts.add(script)
      console.log(`Script initialized: ${script.scriptName}`)
    } catch (error) {
      console.error(`Error initializing script ${script.scriptName}:`, error)
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
      // Disconnect intersection observer
      if (Loader.instance.intersectionObserver) {
        Loader.instance.intersectionObserver.disconnect()
      }
      // Unsubscribe from all consent listeners
      Loader.instance.consentUnsubscribers.forEach(unsubscribe => unsubscribe())
      Loader.instance.consentUnsubscribers.clear()
      // Clear executed scripts tracking
      Loader.instance.executedScripts.clear()
      Loader.instance.observedElements.clear()
      Loader.instance.consentGatedScripts.clear()
      Loader.instance = null
    }
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
            console.error(`Error resuming script ${script.scriptName}:`, error)
          }
        })
      } else {
        // Pause all executed scripts
        this.executedScripts.forEach(script => {
          try {
            script.pause()
          } catch (error) {
            console.error(`Error pausing script ${script.scriptName}:`, error)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  /**
   * Initialize Intersection Observer for 'visible' event type
   */
  private initializeIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver is not supported in this browser')
      return
    }

    const options: IntersectionObserverInit = {
      root: document.body,
      rootMargin: '0px 0px 500px 0px',
      threshold: 0.01,
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const scripts = this.observedElements.get(entry.target)
          if (scripts) {
            scripts.forEach(script => {
              this.executeScript(script)
            })
            // Stop observing this element
            this.intersectionObserver?.unobserve(entry.target)
            this.observedElements.delete(entry.target)
          }
        }
      })
    }, options)
  }

  /**
   * Initialize visible event for a specific script
   * @param script - The script to initialize visible event for
   */
  private initializeVisibleEvent(script: typeof LoadableScript): void {
    if (!this.intersectionObserver) {
      console.warn('IntersectionObserver not available, executing script immediately')
      this.executeScript(script)
      return
    }

    const selector = script.targetSelector || `[data-script="${script.scriptName}"]`
    const elements = document.querySelectorAll(selector)

    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`)
      return
    }

    elements.forEach(element => {
      if (!this.observedElements.has(element)) {
        this.observedElements.set(element, [])
      }
      this.observedElements.get(element)!.push(script)
      this.intersectionObserver!.observe(element)
    })
  }

  /**
   * Initialize consent-gated execution for a specific script
   * Subscribes to consent changes and automatically loads/unloads scripts
   * @param script - The script to initialize consent-gated execution for
   */
  private initializeConsentGatedExecution(script: typeof LoadableScript): void {
    const consentCategory = script.meta?.consentCategory as ConsentCategory | undefined

    if (!consentCategory) {
      console.warn(
        `Script ${script.scriptName} is consent-gated but missing meta.consentCategory. Skipping.`
      )
      return
    }

    // Track this script for the consent category
    if (!this.consentGatedScripts.has(consentCategory)) {
      this.consentGatedScripts.set(consentCategory, new Set())
    }
    this.consentGatedScripts.get(consentCategory)!.add(script)

    // Get the appropriate consent store
    const consentStore = this.getConsentStore(consentCategory)

    // Subscribe to consent changes
    const unsubscribe = consentStore.subscribe(hasConsent => {
      if (hasConsent) {
        // Consent granted - load script if not already executed
        if (!this.executedScripts.has(script)) {
          console.log(
            `✅ Consent granted for ${consentCategory}, loading ${script.scriptName}`
          )
          this.executeScript(script)
        }
      } else {
        // Consent revoked - pause script if it's running
        if (this.executedScripts.has(script)) {
          console.log(
            `⛔ Consent revoked for ${consentCategory}, pausing ${script.scriptName}`
          )
          try {
            script.pause()
            // Optionally remove from executed set if you want it to be able to restart
            // this.executedScripts.delete(script)
          } catch (error) {
            console.error(`Error pausing script ${script.scriptName}:`, error)
          }
        }
      }
    })

    // Store unsubscribe function for cleanup
    this.consentUnsubscribers.set(`${consentCategory}-${script.scriptName}`, unsubscribe)
  }

  /**
   * Get the appropriate consent store for a category
   * @param category - The consent category
   * @returns The consent store for the category
   */
  private getConsentStore(category: ConsentCategory) {
    switch (category) {
      case 'analytics':
        return $hasAnalyticsConsent
      case 'functional':
        return $hasFunctionalConsent
      case 'advertising':
        return $hasAdvertisingConsent
      case 'necessary':
        // Necessary scripts don't need consent - return a store that's always true
        return {
          subscribe: (callback: (_value: boolean) => void) => {
            callback(true)
            return () => {} // No-op unsubscribe
          },
          get: () => true,
        }
      default:
        throw new Error(`Unknown consent category: ${category}`)
    }
  }
}

/**
 * Register a script to be executed when its trigger event occurs
 * @param script - The script to register
 */
export const registerScript = (script: typeof LoadableScript): void => {
  const loader = Loader.getInstance()
  loader.registerScript(script)
}

/**
 * Reset the loader (useful for testing)
 */
export const resetDelayedLoader = (): void => {
  Loader.reset()
}
