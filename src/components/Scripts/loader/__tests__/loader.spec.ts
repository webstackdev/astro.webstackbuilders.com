/**
 * Unit tests for generic script loader with LoadableScript interface
 */

// @vitest-environment happy-dom
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
    static scriptName = name
    static eventType = eventType
    static meta = {}
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

  describe('visible event with Intersection Observer', () => {
    type MockObserverInstance = {
      observe: ReturnType<typeof vi.fn>
      unobserve: ReturnType<typeof vi.fn>
      disconnect: ReturnType<typeof vi.fn>
      takeRecords: ReturnType<typeof vi.fn>
      root: Element | Document | null
      rootMargin: string
      thresholds: number[]
    }

    type MockVisibleScript = ReturnType<typeof createMockScript> & {
      targetSelector?: string
    }

    let mockIntersectionObserver: typeof IntersectionObserver
    let observerCallback: IntersectionObserverCallback
    let observerInstances: MockObserverInstance[] = []

    const createMockEntry = (target: Element, isIntersecting: boolean): IntersectionObserverEntry => {
      const boundingRect: DOMRectReadOnly = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      }
      const intersectionRect: DOMRectReadOnly = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      }
      const mockEntry: IntersectionObserverEntry = {
        target,
        isIntersecting,
        intersectionRatio: isIntersecting ? 0.5 : 0,
        boundingClientRect: boundingRect,
        intersectionRect: intersectionRect,
        rootBounds: null,
        time: Date.now(),
      }
      return mockEntry
    }

    beforeEach(() => {
      // Mock IntersectionObserver as a spyable constructor
      observerInstances = []

      const MockIntersectionObserverClass = vi.fn(function(
        this: IntersectionObserver,
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) {
        observerCallback = callback
        const instance: MockObserverInstance = {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
          root: options?.root ?? null,
          rootMargin: options?.rootMargin ?? '0px',
          thresholds: Array.isArray(options?.threshold) ? options.threshold : [options?.threshold ?? 0],
        }
        observerInstances.push(instance)
        return instance as unknown as IntersectionObserver
      }) as unknown as typeof IntersectionObserver

      mockIntersectionObserver = MockIntersectionObserverClass

      // Replace global IntersectionObserver
      global.IntersectionObserver = mockIntersectionObserver
    })

    afterEach(() => {
      // Clean up
      Reflect.deleteProperty(global, 'IntersectionObserver')
    })

    it('should initialize IntersectionObserver with correct options', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.test-element'

      // Create a mock element
      const mockElement = document.createElement('div')
      mockElement.className = 'test-element'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: document.body,
          rootMargin: '0px 0px 500px 0px',
          threshold: 0.01,
        })
      )

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should observe elements with custom targetSelector', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.custom-selector'

      const mockElement = document.createElement('div')
      mockElement.className = 'custom-selector'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      const firstInstance = observerInstances[0]
      if (firstInstance) {
        expect(firstInstance.observe).toHaveBeenCalledWith(mockElement)
      }

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should observe elements with data-script attribute when no targetSelector provided', () => {
      const VisibleScript = createMockScript('visible', 'TestScript')

      const mockElement = document.createElement('div')
      mockElement.setAttribute('data-script', 'TestScript')
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      const firstInstance = observerInstances[0]
      if (firstInstance) {
        expect(firstInstance.observe).toHaveBeenCalledWith(mockElement)
      }

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should execute script when element becomes visible', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.lazy-element'

      const mockElement = document.createElement('div')
      mockElement.className = 'lazy-element'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      // Simulate intersection
      const mockEntry = createMockEntry(mockElement, true)
      const firstInstance = observerInstances[0]
      if (firstInstance) {
        observerCallback([mockEntry], firstInstance as unknown as IntersectionObserver)

        expect(VisibleScript.mockInit).toHaveBeenCalledTimes(1)
        expect(firstInstance.unobserve).toHaveBeenCalledWith(mockElement)
      }

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should not execute script when element is not intersecting', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.lazy-element'

      const mockElement = document.createElement('div')
      mockElement.className = 'lazy-element'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      // Simulate non-intersection
      const mockEntry = createMockEntry(mockElement, false)
      const firstInstance = observerInstances[0]
      if (firstInstance) {
        observerCallback([mockEntry], firstInstance as unknown as IntersectionObserver)

        expect(VisibleScript.mockInit).not.toHaveBeenCalled()
        expect(firstInstance.unobserve).not.toHaveBeenCalled()
      }

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should handle multiple elements with same selector', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.multi-element'

      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ]

      elements.forEach(el => {
        el.className = 'multi-element'
        document.body.appendChild(el)
      })

      registerScript(VisibleScript)

      const firstInstance = observerInstances[0]
      if (firstInstance) {
        expect(firstInstance.observe).toHaveBeenCalledTimes(3)
        elements.forEach(el => {
          expect(firstInstance.observe).toHaveBeenCalledWith(el)
        })
      }

      // Clean up
      elements.forEach(el => document.body.removeChild(el))
    })

    it('should execute script only once per element', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.once-element'

      const mockElement = document.createElement('div')
      mockElement.className = 'once-element'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      const mockEntry = createMockEntry(mockElement, true)
      const firstInstance = observerInstances[0]
      if (firstInstance) {
        // Trigger first time
        observerCallback([mockEntry], firstInstance as unknown as IntersectionObserver)
        expect(VisibleScript.mockInit).toHaveBeenCalledTimes(1)

        // Trigger again (should not execute again)
        observerCallback([mockEntry], firstInstance as unknown as IntersectionObserver)
        expect(VisibleScript.mockInit).toHaveBeenCalledTimes(1)
      }

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should handle case when no elements found for selector', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.nonexistent-element'

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      registerScript(VisibleScript)

      expect(consoleSpy).toHaveBeenCalledWith(
        'No elements found for selector: .nonexistent-element'
      )

      consoleSpy.mockRestore()
    })

    it('should handle case when IntersectionObserver is not supported', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.test-element'

      // Remove IntersectionObserver
      Reflect.deleteProperty(global, 'IntersectionObserver')

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      resetDelayedLoader()
      registerScript(VisibleScript)

      expect(consoleSpy).toHaveBeenCalledWith(
        'IntersectionObserver is not supported in this browser'
      )
      expect(VisibleScript.mockInit).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()

      // Restore IntersectionObserver for other tests
      global.IntersectionObserver = mockIntersectionObserver
    })

    it('should disconnect observer on reset', () => {
      const VisibleScript = createMockScript('visible', 'VisibleScript') as MockVisibleScript
      VisibleScript.targetSelector = '.test-element'

      const mockElement = document.createElement('div')
      mockElement.className = 'test-element'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript)

      const firstInstance = observerInstances[0]
      if (firstInstance) {
        expect(firstInstance.disconnect).not.toHaveBeenCalled()

        resetDelayedLoader()

        expect(firstInstance.disconnect).toHaveBeenCalledTimes(1)
      }

      // Clean up
      document.body.removeChild(mockElement)
    })

    it('should handle multiple scripts for same element', () => {
      const VisibleScript1 = createMockScript('visible', 'VisibleScript1') as MockVisibleScript
      const VisibleScript2 = createMockScript('visible', 'VisibleScript2') as MockVisibleScript
      VisibleScript1.targetSelector = '.shared-element'
      VisibleScript2.targetSelector = '.shared-element'

      const mockElement = document.createElement('div')
      mockElement.className = 'shared-element'
      document.body.appendChild(mockElement)

      registerScript(VisibleScript1)
      registerScript(VisibleScript2)

      const mockEntry = createMockEntry(mockElement, true)
      const firstInstance = observerInstances[0]
      if (firstInstance) {
        observerCallback([mockEntry], firstInstance as unknown as IntersectionObserver)

        expect(VisibleScript1.mockInit).toHaveBeenCalledTimes(1)
        expect(VisibleScript2.mockInit).toHaveBeenCalledTimes(1)
      }

      // Clean up
      document.body.removeChild(mockElement)
    })
  })
})