/**
 * Type definitions for the generic event-driven loader.
 * Contains interfaces and types for script initialization based on DOM and user interaction events.
 */

/** The events that qualify as user interaction and should trigger executing the action. */
export type UserInteractionEvent =
  | 'keydown'
  | 'mousemove'
  | 'wheel'
  | 'touchmove'
  | 'touchstart'
  | 'touchend'

/** All supported trigger events for script execution */
export type TriggerEvent =
  | 'delayed'
  | 'astro:before-preparation'
  | 'astro:after-preparation'
  | 'astro:before-swap'
  | 'astro:after-swap'
  | 'astro:page-load'

/** Abstract class for scripts that can be loaded by the Loader */
export abstract class LoadableScript {
  /** Name identifier for the script */
  public static scriptName: string
  /** The event that should trigger this script's initialization */
  public static eventType: TriggerEvent

  /** Initialize the script */
  public static init(): void {
    throw new Error('Init method not implemented.')
  }
  /** Pause script execution */
  public static pause(): void {
    throw new Error('Pause method not implemented.')
  }
  /** Resume script execution */
  public static resume(): void {
    throw new Error('Resume method not implemented.')
  }
  /** Reset script execution for use on SPA page navigation */
  public static reset(): void {
    throw new Error('Reset method not implemented.')
  }
}
