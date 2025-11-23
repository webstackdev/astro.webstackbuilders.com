/**
 * Animation lifecycle event system
 * Controls background animations when overlays/modals open and close
 */

// @TODO: refactor to pubsub-js
// @TODO: Use a nanostore backing in a store file. Where does the logic to update the store live? In the event system? This is what will be called by a component that needs to pause or resume animations. But is there a danger of dispatching two events for the same update, if we have an event system and the useStore() hook or .subscribe() to a store for changes?

/*
Use Nanostores for State Management:

Use Nanostores for data that represents the current state of your application (e.g., shopping cart count, user authentication status, theme setting).

Subscribe to changes: Components can listen() to these stores or use framework-specific hooks (useStore()) to reactively update the UI when the state changes.

Use a dedicated Pub/Sub library for Events:

For transient events or actions that don't represent a persistent state, a dedicated library like pubsub-js or a simple built-in event emitter (or even just callbacks) is a better fit.

Example events: "user logged in", "modal closed", "item dragged", "form submitted successfully". These are actions that happen at a specific point in time, and you only care about notifying active listeners at that moment.
*/

/* eslint-disable no-unused-vars */
export enum AnimationLifecycleEvent {
  /** Fired when an overlay/modal opens that should pause background animations */
  OVERLAY_OPENED = 'animation:overlay-opened',
  /** Fired when an overlay/modal closes that should resume background animations */
  OVERLAY_CLOSED = 'animation:overlay-closed',
}
/* eslint-enable no-unused-vars */

/**
 * Dispatch an animation lifecycle event
 * @param eventType - The type of event to dispatch
 * @param detail - Optional detail data to pass with the event
 */
export function dispatchAnimationEvent(eventType: AnimationLifecycleEvent, detail?: unknown): void {
  const event = new CustomEvent(eventType, { detail })
  document.dispatchEvent(event)
}

/**
 * Listen for an animation lifecycle event
 * @param eventType - The type of event to listen for
 * @param handler - The handler function to call when the event is fired
 * @returns Cleanup function to remove the event listener
 */
export function onAnimationEvent(
  eventType: AnimationLifecycleEvent,
  handler: (_event: CustomEvent) => void
): () => void {
  const listener = (event: Event) => handler(event as CustomEvent)
  document.addEventListener(eventType, listener)
  return () => document.removeEventListener(eventType, listener)
}
