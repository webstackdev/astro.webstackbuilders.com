// @vitest-environment happy-dom

/**
 * Unit tests for the animation lifecycle event system
 * Tests event dispatching, listening, and cleanup functionality
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { dispatchAnimationEvent, onAnimationEvent, AnimationLifecycleEvent } from '@components/scripts/events'

describe('Animation Lifecycle Events System', () => {
  // Clean up event listeners after each test
  afterEach(() => {
    // Remove all event listeners by cloning and replacing the document
    vi.clearAllMocks()
  })

  describe('AnimationLifecycleEvent enum', () => {
    it('should define OVERLAY_OPENED event', () => {
      expect(AnimationLifecycleEvent.OVERLAY_OPENED).toBe('animation:overlay-opened')
    })

    it('should define OVERLAY_CLOSED event', () => {
      expect(AnimationLifecycleEvent.OVERLAY_CLOSED).toBe('animation:overlay-closed')
    })
  })

  describe('dispatchAnimationEvent', () => {
    it('should dispatch a custom event without detail', () => {
      const handler = vi.fn()
      document.addEventListener(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0]?.[0] as CustomEvent
      expect(event.type).toBe(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(event.detail).toBeNull()

      document.removeEventListener(AnimationLifecycleEvent.OVERLAY_OPENED, handler)
    })

    it('should dispatch a custom event with detail data', () => {
      const handler = vi.fn()
      const detail = { source: 'navigation', timestamp: Date.now() }
      document.addEventListener(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, detail)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AnimationLifecycleEvent.OVERLAY_OPENED,
          detail,
        })
      )

      document.removeEventListener(AnimationLifecycleEvent.OVERLAY_OPENED, handler)
    })

    it('should dispatch multiple events in sequence', () => {
      const handler = vi.fn()
      document.addEventListener(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, { source: 'nav' })
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, { source: 'modal' })

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ detail: { source: 'nav' } })
      )
      expect(handler).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ detail: { source: 'modal' } })
      )

      document.removeEventListener(AnimationLifecycleEvent.OVERLAY_OPENED, handler)
    })
  })

  describe('onAnimationEvent', () => {
    it('should register an event listener', () => {
      const handler = vi.fn()
      const cleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)

      expect(handler).toHaveBeenCalledTimes(1)

      cleanup()
    })

    it('should pass event detail to handler', () => {
      const handler = vi.fn()
      const detail = { source: 'test', data: { foo: 'bar' } }
      const cleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, detail)

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ detail })
      )

      cleanup()
    })

    it('should return a cleanup function that removes the listener', () => {
      const handler = vi.fn()
      const cleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      // Event should trigger handler
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(handler).toHaveBeenCalledTimes(1)

      // Clean up listener
      cleanup()

      // Event should not trigger handler after cleanup
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(handler).toHaveBeenCalledTimes(1) // Still 1, not 2
    })

    it('should handle multiple listeners for the same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      const cleanup1 = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler1)
      const cleanup2 = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler2)
      const cleanup3 = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler3)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)

      cleanup1()
      cleanup2()
      cleanup3()
    })

    it('should handle multiple listeners and selective cleanup', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const cleanup1 = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler1)
      const cleanup2 = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler2)

      // First dispatch - both should be called
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)

      // Clean up first handler
      cleanup1()

      // Second dispatch - only handler2 should be called
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(handler1).toHaveBeenCalledTimes(1) // Still 1
      expect(handler2).toHaveBeenCalledTimes(2) // Now 2

      cleanup2()
    })
  })

  describe('Integration - OVERLAY_OPENED and OVERLAY_CLOSED workflow', () => {
    it('should simulate navigation menu open/close cycle', () => {
      const pauseHandler = vi.fn()
      const resumeHandler = vi.fn()

      const pauseCleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, pauseHandler)
      const resumeCleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, resumeHandler)

      // Simulate opening navigation
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, { source: 'navigation' })
      expect(pauseHandler).toHaveBeenCalledTimes(1)
      expect(resumeHandler).toHaveBeenCalledTimes(0)

      // Simulate closing navigation
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, { source: 'navigation' })
      expect(pauseHandler).toHaveBeenCalledTimes(1)
      expect(resumeHandler).toHaveBeenCalledTimes(1)

      pauseCleanup()
      resumeCleanup()
    })

    it('should handle multiple overlays opening and closing', () => {
      const stateChanges: string[] = []

      const openCleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, (event) => {
        stateChanges.push(`opened:${event.detail?.source}`)
      })
      const closeCleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, (event) => {
        stateChanges.push(`closed:${event.detail?.source}`)
      })

      // Multiple overlays opening and closing
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, { source: 'nav' })
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, { source: 'modal' })
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, { source: 'modal' })
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, { source: 'nav' })

      expect(stateChanges).toEqual([
        'opened:nav',
        'opened:modal',
        'closed:modal',
        'closed:nav',
      ])

      openCleanup()
      closeCleanup()
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle cleanup being called multiple times', () => {
      const handler = vi.fn()
      const cleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler)

      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(handler).toHaveBeenCalledTimes(1)

      // Call cleanup multiple times
      cleanup()
      cleanup()
      cleanup()

      // Should still not receive events
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle dispatching events with no listeners', () => {
      // Should not throw error
      expect(() => {
        dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED)
        dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED)
      }).not.toThrow()
    })

    it('should handle complex detail objects', () => {
      const handler = vi.fn()
      const complexDetail = {
        source: 'navigation',
        metadata: {
          timestamp: Date.now(),
          user: { id: 123, name: 'Test' },
          actions: ['open', 'animate', 'focus'],
        },
        nested: {
          deeply: {
            nested: {
              value: true,
            },
          },
        },
      }

      const cleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, handler)
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, complexDetail)

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ detail: complexDetail })
      )

      cleanup()
    })
  })
})
