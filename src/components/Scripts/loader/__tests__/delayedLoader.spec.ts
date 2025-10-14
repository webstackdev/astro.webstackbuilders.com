/**
 * Unit tests for delayedLoader singleton
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  addDelayedExecutionScripts,
  resetDelayedLoader,
  eventList,
  autoLoadDuration,
} from '../index'

describe('delayedLoader', () => {
  beforeEach(() => {
    // Reset the singleton before each test
    resetDelayedLoader()
    // Clear all timers and event listeners
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up after each test
    resetDelayedLoader()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('addDelayedExecutionScripts', () => {
    it('should register and execute scripts after timeout', () => {
      const mockScript1 = vi.fn()
      const mockScript2 = vi.fn()

      addDelayedExecutionScripts([mockScript1, mockScript2])

      // Scripts should not execute immediately
      expect(mockScript1).not.toHaveBeenCalled()
      expect(mockScript2).not.toHaveBeenCalled()

      // Advance time to trigger timeout
      vi.advanceTimersByTime(autoLoadDuration)

      // Both scripts should have executed
      expect(mockScript1).toHaveBeenCalledTimes(1)
      expect(mockScript2).toHaveBeenCalledTimes(1)
    })

    it('should execute scripts on user interaction before timeout', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Script should not execute immediately
      expect(mockScript).not.toHaveBeenCalled()

      // Simulate user interaction (keydown)
      const keydownEvent = new KeyboardEvent('keydown')
      document.dispatchEvent(keydownEvent)

      // Script should have executed
      expect(mockScript).toHaveBeenCalledTimes(1)

      // Advance time - script should not execute again
      vi.advanceTimersByTime(autoLoadDuration)
      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should execute scripts on mousemove interaction', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Simulate mousemove interaction
      const mousemoveEvent = new MouseEvent('mousemove')
      document.dispatchEvent(mousemoveEvent)

      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should execute scripts on wheel interaction', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Simulate wheel interaction
      const wheelEvent = new WheelEvent('wheel')
      document.dispatchEvent(wheelEvent)

      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should execute scripts on touchstart interaction', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Simulate touchstart interaction
      const touchstartEvent = new TouchEvent('touchstart')
      document.dispatchEvent(touchstartEvent)

      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should execute scripts on touchmove interaction', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Simulate touchmove interaction
      const touchmoveEvent = new TouchEvent('touchmove')
      document.dispatchEvent(touchmoveEvent)

      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should execute scripts on touchend interaction', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Simulate touchend interaction
      const touchendEvent = new TouchEvent('touchend')
      document.dispatchEvent(touchendEvent)

      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple components registering scripts (singleton behavior)', () => {
      const script1 = vi.fn()
      const script2 = vi.fn()
      const script3 = vi.fn()

      // First component registers scripts
      addDelayedExecutionScripts([script1])

      // Second component registers scripts
      addDelayedExecutionScripts([script2])

      // Third component registers scripts
      addDelayedExecutionScripts([script3])

      // None should execute yet
      expect(script1).not.toHaveBeenCalled()
      expect(script2).not.toHaveBeenCalled()
      expect(script3).not.toHaveBeenCalled()

      // Simulate user interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))

      // All scripts should execute together
      expect(script1).toHaveBeenCalledTimes(1)
      expect(script2).toHaveBeenCalledTimes(1)
      expect(script3).toHaveBeenCalledTimes(1)
    })

    it('should execute late-registered scripts immediately if already executed', () => {
      const earlyScript = vi.fn()
      const lateScript = vi.fn()

      // Register first script
      addDelayedExecutionScripts([earlyScript])

      // Trigger execution with user interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(earlyScript).toHaveBeenCalledTimes(1)

      // Register script after execution
      addDelayedExecutionScripts([lateScript])

      // Late script should execute immediately
      expect(lateScript).toHaveBeenCalledTimes(1)
    })

    it('should only execute scripts once even with multiple user interactions', () => {
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // First interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))
      expect(mockScript).toHaveBeenCalledTimes(1)

      // Second interaction - should not execute again
      document.dispatchEvent(new MouseEvent('mousemove'))
      expect(mockScript).toHaveBeenCalledTimes(1)

      // Third interaction - should not execute again
      document.dispatchEvent(new WheelEvent('wheel'))
      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should cancel timeout when user interaction occurs', () => {
      const mockScript = vi.fn()
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      addDelayedExecutionScripts([mockScript])

      // Simulate user interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))

      // clearTimeout should have been called
      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(mockScript).toHaveBeenCalledTimes(1)

      // Advance time - script should not execute again
      vi.advanceTimersByTime(autoLoadDuration)
      expect(mockScript).toHaveBeenCalledTimes(1)
    })

    it('should handle empty script array', () => {
      expect(() => {
        addDelayedExecutionScripts([])
      }).not.toThrow()

      // Advance time
      vi.advanceTimersByTime(autoLoadDuration)

      // Should not throw error
      expect(true).toBe(true)
    })

    it('should execute scripts in the order they were registered', () => {
      const executionOrder: number[] = []

      const script1 = vi.fn(() => executionOrder.push(1))
      const script2 = vi.fn(() => executionOrder.push(2))
      const script3 = vi.fn(() => executionOrder.push(3))

      addDelayedExecutionScripts([script1, script2, script3])

      // Trigger execution
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it('should maintain order across multiple registerScripts calls', () => {
      const executionOrder: number[] = []

      const script1 = vi.fn(() => executionOrder.push(1))
      const script2 = vi.fn(() => executionOrder.push(2))
      const script3 = vi.fn(() => executionOrder.push(3))

      addDelayedExecutionScripts([script1])
      addDelayedExecutionScripts([script2])
      addDelayedExecutionScripts([script3])

      // Trigger execution
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(executionOrder).toEqual([1, 2, 3])
    })
  })

  describe('resetDelayedLoader', () => {
    it('should reset the singleton instance', () => {
      const mockScript1 = vi.fn()
      const mockScript2 = vi.fn()

      // Register and execute scripts
      addDelayedExecutionScripts([mockScript1])
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(mockScript1).toHaveBeenCalledTimes(1)

      // Reset the loader
      resetDelayedLoader()

      // Register new script after reset
      addDelayedExecutionScripts([mockScript2])

      // Should not execute immediately (new timeout should be set)
      expect(mockScript2).not.toHaveBeenCalled()

      // Trigger execution
      document.dispatchEvent(new MouseEvent('mousemove'))

      expect(mockScript2).toHaveBeenCalledTimes(1)
    })

    it('should clear timeout when resetting', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const mockScript = vi.fn()

      addDelayedExecutionScripts([mockScript])

      // Reset should clear the timeout
      resetDelayedLoader()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle reset when no instance exists', () => {
      expect(() => {
        resetDelayedLoader()
      }).not.toThrow()
    })
  })

  describe('eventList constant', () => {
    it('should contain all expected event types', () => {
      expect(eventList).toContain('keydown')
      expect(eventList).toContain('mousemove')
      expect(eventList).toContain('wheel')
      expect(eventList).toContain('touchmove')
      expect(eventList).toContain('touchstart')
      expect(eventList).toContain('touchend')
    })

    it('should have correct length', () => {
      expect(eventList).toHaveLength(6)
    })
  })

  describe('autoLoadDuration constant', () => {
    it('should be 5 seconds in milliseconds', () => {
      expect(autoLoadDuration).toBe(5000)
    })
  })

  describe('event listener cleanup', () => {
    it('should remove event listeners after execution via timeout', () => {
      const mockScript = vi.fn()
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      addDelayedExecutionScripts([mockScript])

      // Advance time to trigger timeout
      vi.advanceTimersByTime(autoLoadDuration)

      // All event listeners should be removed
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(eventList.length)
    })

    it('should remove event listeners after user interaction', () => {
      const mockScript = vi.fn()
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      addDelayedExecutionScripts([mockScript])

      // Trigger user interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))

      // Event listeners should be removed (all except the triggered one)
      expect(removeEventListenerSpy).toHaveBeenCalled()
      expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid successive registrations', () => {
      const scripts = Array.from({ length: 10 }, () => vi.fn())

      // Register all scripts rapidly
      scripts.forEach(script => {
        addDelayedExecutionScripts([script])
      })

      // Trigger execution
      document.dispatchEvent(new KeyboardEvent('keydown'))

      // All scripts should execute once
      scripts.forEach(script => {
        expect(script).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle scripts that register more scripts', () => {
      const innerScript = vi.fn()
      const outerScript = vi.fn(() => {
        // This should execute immediately since outer already executed
        addDelayedExecutionScripts([innerScript])
      })

      addDelayedExecutionScripts([outerScript])

      // Trigger execution
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(outerScript).toHaveBeenCalledTimes(1)
      expect(innerScript).toHaveBeenCalledTimes(1)
    })

    it('should not interfere with other document event listeners', () => {
      const mockScript = vi.fn()
      const externalListener = vi.fn()

      // Add an external event listener
      document.addEventListener('keydown', externalListener)

      addDelayedExecutionScripts([mockScript])

      // Trigger keydown
      document.dispatchEvent(new KeyboardEvent('keydown'))

      // Both should have been called
      expect(mockScript).toHaveBeenCalledTimes(1)
      expect(externalListener).toHaveBeenCalledTimes(1)

      // Clean up
      document.removeEventListener('keydown', externalListener)
    })
  })
})
