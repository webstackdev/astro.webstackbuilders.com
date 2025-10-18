/**
 * Unit tests for generic script loader with LoadableScript interface
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerScript,
  resetDelayedLoader,
  userInteractionEvents,
  autoLoadDuration,
} from '../index'
import type { TriggerEvent } from '../@types/loader'

/**
 * Helper function to create mock LoadableScript classes for testing
 */
function createMockScript(eventType: TriggerEvent, name = 'MockScript') {
  return class {
    static name = name
    static eventType = eventType
    static paused = false
    static executed = false
    static mockInit = vi.fn()

    static init(): void {
      this.executed = true
      this.mockInit()
    }

    static pause(): void {
      this.paused = true
    }

    static resume(): void {
      this.paused = false
    }

    static reset(): void {
      this.paused = false
      this.executed = false
      this.mockInit.mockClear()
    }
  }
}

describe('Generic Script Loader', () => {
  beforeEach(() => {
    resetDelayedLoader()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetDelayedLoader()
  })

  describe('registerScript with LoadableScript interface', () => {
    it('should register and execute delayed scripts after timeout', async () => {
      const DelayedScript = createMockScript('delayed', 'DelayedScript')

      // Mock setTimeout and clearTimeout
      const mockSetTimeout = vi.spyOn(global, 'setTimeout')
      const mockClearTimeout = vi.spyOn(global, 'clearTimeout')

      mockSetTimeout.mockImplementation((callback: () => void) => {
        callback()
        return 1 as unknown as NodeJS.Timeout
      })

      registerScript(DelayedScript)

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), autoLoadDuration)
      expect(DelayedScript.mockInit).toHaveBeenCalled()
      expect(DelayedScript.executed).toBe(true)

      mockSetTimeout.mockRestore()
      mockClearTimeout.mockRestore()
    })

    it('should execute delayed scripts on user interaction', () => {
      const DelayedScript = createMockScript('delayed', 'DelayedScript')

      registerScript(DelayedScript)

      // Simulate user interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(DelayedScript.mockInit).toHaveBeenCalled()
      expect(DelayedScript.executed).toBe(true)
    })

    it('should handle Astro View Transition events', () => {
      const BeforePrepScript = createMockScript('astro:before-preparation', 'BeforePrepScript')

      registerScript(BeforePrepScript)

      // Script should not execute immediately
      expect(BeforePrepScript.mockInit).not.toHaveBeenCalled()

      // Simulate Astro view transition event
      document.dispatchEvent(new Event('astro:before-preparation'))
      expect(BeforePrepScript.mockInit).toHaveBeenCalled()
    })

    it('should handle Astro lifecycle events', () => {
      const PageLoadScript = createMockScript('astro:page-load', 'PageLoadScript')

      registerScript(PageLoadScript)

      // Script should not execute immediately
      expect(PageLoadScript.mockInit).not.toHaveBeenCalled()

      document.dispatchEvent(new Event('astro:page-load'))
      expect(PageLoadScript.mockInit).toHaveBeenCalled()
    })

    it('should handle multiple event types correctly', () => {
      const DelayedScript = createMockScript('delayed', 'DelayedScript')
      const BeforePrepScript = createMockScript('astro:before-preparation', 'BeforePrepScript')
      const PageLoadScript = createMockScript('astro:page-load', 'PageLoadScript')

      registerScript(DelayedScript)
      registerScript(BeforePrepScript)
      registerScript(PageLoadScript)

      // Trigger user interaction (should only execute delayed script)
      document.dispatchEvent(new KeyboardEvent('keydown'))
      expect(DelayedScript.mockInit).toHaveBeenCalledTimes(1)
      expect(BeforePrepScript.mockInit).not.toHaveBeenCalled()
      expect(PageLoadScript.mockInit).not.toHaveBeenCalled()

      // Trigger before-preparation (should execute beforePrep script)
      document.dispatchEvent(new Event('astro:before-preparation'))
      expect(BeforePrepScript.mockInit).toHaveBeenCalledTimes(1)
      expect(PageLoadScript.mockInit).not.toHaveBeenCalled()

      // Trigger page-load (should execute page load script)
      document.dispatchEvent(new Event('astro:page-load'))
      expect(PageLoadScript.mockInit).toHaveBeenCalledTimes(1)
    })
  })

  describe('pause/resume functionality', () => {
    it('should pause executed scripts when page becomes hidden', () => {
      const PageLoadScript = createMockScript('astro:page-load', 'PageLoadScript')

      registerScript(PageLoadScript)

      // Execute the script first
      document.dispatchEvent(new Event('astro:page-load'))

      expect(PageLoadScript.executed).toBe(true)

      // Create a spy to verify pause was called
      const pauseSpy = vi.spyOn(PageLoadScript, 'pause')

      // Simulate page becoming hidden using visibilityState
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('should resume executed scripts when page becomes visible', () => {
      const PageLoadScript = createMockScript('astro:page-load', 'PageLoadScript')

      registerScript(PageLoadScript)

      // Execute the script first
      document.dispatchEvent(new Event('astro:page-load'))

      expect(PageLoadScript.executed).toBe(true)

      // Create spies to verify methods were called
      const pauseSpy = vi.spyOn(PageLoadScript, 'pause')
      const resumeSpy = vi.spyOn(PageLoadScript, 'resume')

      // Pause first
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
      expect(pauseSpy).toHaveBeenCalled()

      // Then resume
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(resumeSpy).toHaveBeenCalled()
    })
  })

  describe('resetDelayedLoader', () => {
    it('should reset the singleton instance', () => {
      const DelayedScript1 = createMockScript('delayed', 'DelayedScript1')
      const DelayedScript2 = createMockScript('delayed', 'DelayedScript2')

      // Register and trigger first script
      registerScript(DelayedScript1)
      document.dispatchEvent(new KeyboardEvent('keydown'))
      expect(DelayedScript1.mockInit).toHaveBeenCalledTimes(1)

      // Reset the loader
      resetDelayedLoader()

      // Register second script after reset
      registerScript(DelayedScript2)
      document.dispatchEvent(new KeyboardEvent('keydown'))
      expect(DelayedScript2.mockInit).toHaveBeenCalledTimes(1)
    })

    it('should handle reset when no instance exists', () => {
      // Should not throw an error
      expect(() => resetDelayedLoader()).not.toThrow()
    })
  })

  describe('userInteractionEvents constant', () => {
    it('should contain all expected event types', () => {
      expect(userInteractionEvents).toContain('keydown')
      expect(userInteractionEvents).toContain('mousemove')
      expect(userInteractionEvents).toContain('wheel')
      expect(userInteractionEvents).toContain('touchmove')
      expect(userInteractionEvents).toContain('touchstart')
      expect(userInteractionEvents).toContain('touchend')
    })

    it('should have correct length', () => {
      expect(userInteractionEvents).toHaveLength(6)
    })
  })

  describe('autoLoadDuration constant', () => {
    it('should be 5 seconds in milliseconds', () => {
      expect(autoLoadDuration).toBe(5000)
    })
  })
})
