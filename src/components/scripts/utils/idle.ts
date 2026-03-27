/**
 * Schedules a callback to run when the browser is idle, with a `setTimeout` fallback
 * for browsers that do not support `requestIdleCallback` (Safari < 16.4).
 */
export function whenIdle(callback: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => callback())
    return
  }
  setTimeout(callback, 0)
}
