/**
 * Type guards for DOM events
 */

export function isKeyboardEvent(event: Event): event is Event {
  if (event instanceof KeyboardEvent) return true
  return false
}
