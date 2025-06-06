import { vi } from "vitest"

/**
 * Determine if Jest fake timers are in use
 *
 * @returns true with fake timers, false with real timers
 */
export const checkFakedTimerStatus = (): boolean => {
  const isJestDefined = typeof vi !== 'undefined'
  const isSetTimeoutDefined = typeof setTimeout !== 'undefined'
  const isSetTimeoutMocked = Object.prototype.hasOwnProperty.call(setTimeout, '_isMockFunction')
  const isSetTimeoutClocked = Object.prototype.hasOwnProperty.call(setTimeout, 'clock')
  return isJestDefined && isSetTimeoutDefined && (isSetTimeoutMocked || isSetTimeoutClocked)
}
