/**
 * Animation lifecycle event system
 * Controls background animations when overlays/modals open and close
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
