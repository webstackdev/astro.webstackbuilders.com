/**
 * Type definitions for the generic event-driven loader.
 * Contains interfaces and types for script initialization based on DOM and user interaction events.
 */

/** The events that qualify as user interaction and should trigger executing the action. */
export type UserInteractionEvent = 'keydown' | 'mousemove' | 'wheel' | 'touchmove' | 'touchstart' | 'touchend'

/** All supported trigger events for script execution */
export type TriggerEvent =
  | "delayed"
  | "astro:before-preparation"
  | "astro:after-preparation"
  | "astro:before-swap"
  | "astro:after-swap"
  | "astro:page-load";

/** Interface for scripts that can be loaded by the Loader */
export interface LoadableScript {
  /** Initialize the script */
  init(): void;
  /** The event that should trigger this script's initialization */
  getEventType(): TriggerEvent;
  /** Pause script execution (reserved for future use) */
  pause(): void;
  /** Resume script execution (reserved for future use) */
  resume(): void;
}