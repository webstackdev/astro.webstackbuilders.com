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
import type { LoadableScript, TriggerEvent } from '../@types/loader'

// Mock LoadableScript implementation for testing
class MockLoadableScript implements LoadableScript {
  public paused = false
  public executed = false

  constructor(
    private _eventType: TriggerEvent,
    private _mockInit = vi.fn()
  ) {}

  init(): void {
    this.executed = true
    this._mockInit()
  }

  getEventType(): TriggerEvent {
    return this._eventType
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
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
      const mockInit = vi.fn()
      const script = new MockLoadableScript('delayed', mockInit)

      // Mock setTimeout and clearTimeout
      const mockSetTimeout = vi.spyOn(global, 'setTimeout')
      const mockClearTimeout = vi.spyOn(global, 'clearTimeout')

      mockSetTimeout.mockImplementation((callback: () => void) => {
        callback()
        return 1 as unknown as NodeJS.Timeout
      })

      registerScript(script)

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), autoLoadDuration)
      expect(mockInit).toHaveBeenCalled()
      expect(script.executed).toBe(true)

      mockSetTimeout.mockRestore()
      mockClearTimeout.mockRestore()
    })

    it('should execute delayed scripts on user interaction', () => {
      const mockInit = vi.fn()
      const script = new MockLoadableScript('delayed', mockInit)

      registerScript(script)

      // Simulate user interaction
      document.dispatchEvent(new KeyboardEvent('keydown'))

      expect(mockInit).toHaveBeenCalled()
      expect(script.executed).toBe(true)
    })

    it('should handle DOM lifecycle events when document is loading', () => {
      const mockInit = vi.fn()
      const script = new MockLoadableScript('DOMContentLoaded', mockInit)

      // Mock document.readyState as loading
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
        configurable: true
      })

      registerScript(script)

      // Script should not execute immediately since DOM is still loading
      expect(mockInit).not.toHaveBeenCalled()

      // Simulate DOMContentLoaded event
      document.dispatchEvent(new Event('DOMContentLoaded'))
      expect(mockInit).toHaveBeenCalled()
    })

    it('should handle Astro lifecycle events', () => {
      const mockInit = vi.fn()
      const script = new MockLoadableScript('astro:page-load', mockInit)

      registerScript(script)
      expect(mockInit).not.toHaveBeenCalled()

      document.dispatchEvent(new Event('astro:page-load'))
      expect(mockInit).toHaveBeenCalled()
    })

    it('should handle multiple event types correctly', () => {
      const delayedInit = vi.fn()
      const domInit = vi.fn()
      const astroInit = vi.fn()

      const delayedScript = new MockLoadableScript('delayed', delayedInit)
      const domScript = new MockLoadableScript('DOMContentLoaded', domInit)
      const astroScript = new MockLoadableScript('astro:page-load', astroInit)

      // Mock document.readyState as loading
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
        configurable: true
      })

      registerScript(delayedScript)
      registerScript(domScript)
      registerScript(astroScript)

      // Trigger user interaction (should only execute delayed script)
      document.dispatchEvent(new KeyboardEvent('keydown'))
      expect(delayedInit).toHaveBeenCalledTimes(1)
      expect(domInit).not.toHaveBeenCalled()
      expect(astroInit).not.toHaveBeenCalled()

      // Trigger DOM event
      document.dispatchEvent(new Event('DOMContentLoaded'))
      expect(domInit).toHaveBeenCalledTimes(1)
      expect(astroInit).not.toHaveBeenCalled()

      // Trigger Astro event
      document.dispatchEvent(new Event('astro:page-load'))
      expect(astroInit).toHaveBeenCalledTimes(1)
    })
  })

  describe('pause/resume functionality', () => {
    it('should pause executed scripts when page becomes hidden', () => {
      const script = new MockLoadableScript('DOMContentLoaded')

      // Execute script first by triggering its event
      registerScript(script)
      document.dispatchEvent(new Event('DOMContentLoaded'))

      expect(script.executed).toBe(true)

      // Simulate page becoming hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(script.paused).toBe(true)
    })

    it('should resume executed scripts when page becomes visible', () => {
      const script = new MockLoadableScript('DOMContentLoaded')

      // Execute script first
      registerScript(script)
      document.dispatchEvent(new Event('DOMContentLoaded'))

      expect(script.executed).toBe(true)

      // Pause first
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
      expect(script.paused).toBe(true)

      // Resume
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
      expect(script.paused).toBe(false)
    })
  })

  describe('resetDelayedLoader', () => {
    it('should reset the singleton instance', () => {
      const script1 = new MockLoadableScript('delayed')
      const script2 = new MockLoadableScript('delayed')

      registerScript(script1)
      resetDelayedLoader()
      registerScript(script2)

      // Should not throw any errors
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown'))
      }).not.toThrow()
    })

    it('should handle reset when no instance exists', () => {
      expect(() => resetDelayedLoader()).not.toThrow()
    })
  })

  describe('userInteractionEvents constant', () => {
    it('should contain all expected event types', () => {
      const expectedEvents = [
        'keydown',
        'mousemove',
        'wheel',
        'touchmove',
        'touchstart',
        'touchend'
      ]

      expectedEvents.forEach(event => {
        expect(userInteractionEvents).toContain(event)
      })
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
