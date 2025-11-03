/**
 * Custom event system for script-to-script communication
 * Allows scripts to broadcast state changes that other scripts can respond to
 */

export enum ScriptEvent {
  /** Fired when an overlay/modal opens that should pause background animations */
  OVERLAY_OPENED = 'script:overlay-opened',
  /** Fired when an overlay/modal closes that should resume background animations */
  OVERLAY_CLOSED = 'script:overlay-closed',
}

/**
 * Dispatch a custom script event
 * @param eventType - The type of event to dispatch
 * @param detail - Optional detail data to pass with the event
 */
export function dispatchScriptEvent(eventType: ScriptEvent, detail?: unknown): void {
  const event = new CustomEvent(eventType, { detail })
  document.dispatchEvent(event)
}

/**
 * Listen for a custom script event
 * @param eventType - The type of event to listen for
 * @param handler - The handler function to call when the event is fired
 * @returns Cleanup function to remove the event listener
 */
export function onScriptEvent(
  eventType: ScriptEvent,
  handler: (event: CustomEvent) => void
): () => void {
  const listener = (event: Event) => handler(event as CustomEvent)
  document.addEventListener(eventType, listener)
  return () => document.removeEventListener(eventType, listener)
}
