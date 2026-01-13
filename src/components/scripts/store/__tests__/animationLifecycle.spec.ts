// @vitest-environment jsdom

import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest'
import {
  __resetAnimationLifecycleForTests,
  clearAnimationPreference,
  createAnimationController,
  getAnimationPreference,
  initAnimationLifecycle,
  setAnimationPreference,
  setOverlayPauseState,
} from '@components/scripts/store/animationLifecycle'

type MatchMediaListener = (_event: MediaQueryListEvent) => void

const matchMediaListeners = new Set<MatchMediaListener>()
let reducedMotionMatches = false
let hiddenState = false
const originalMatchMedia = window.matchMedia
const originalHiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden')

const installMatchMediaStub = () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(
      () =>
        ({
          matches: reducedMotionMatches,
          addEventListener: (_event: string, handler: EventListenerOrEventListenerObject) => {
            matchMediaListeners.add(handler as MatchMediaListener)
          },
          removeEventListener: (_event: string, handler: EventListenerOrEventListenerObject) => {
            matchMediaListeners.delete(handler as MatchMediaListener)
          },
          addListener: (_handler: MatchMediaListener) => {
            // Legacy API fallback; keep to satisfy potential consumers
          },
          removeListener: (_handler: MatchMediaListener) => {
            // Legacy API fallback
          },
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          dispatchEvent: () => true,
        }) satisfies MediaQueryList
    ),
  })
}

const installDocumentHiddenStub = () => {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hiddenState,
  })
}

const dispatchVisibilityChange = () => {
  document.dispatchEvent(new Event('visibilitychange'))
}

const dispatchReducedMotionChange = (matches: boolean) => {
  reducedMotionMatches = matches
  matchMediaListeners.forEach(listener => {
    listener({ matches } as MediaQueryListEvent)
  })
}

beforeAll(() => {
  installMatchMediaStub()
  installDocumentHiddenStub()
})

afterAll(() => {
  matchMediaListeners.clear()
  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    })
  }

  if (originalHiddenDescriptor) {
    Object.defineProperty(document, 'hidden', originalHiddenDescriptor)
  }
})

beforeEach(() => {
  reducedMotionMatches = false
  hiddenState = false
  matchMediaListeners.clear()
  __resetAnimationLifecycleForTests()
})

describe('animation lifecycle store', () => {
  it('plays animations by default when no blockers exist', () => {
    const onPlay = vi.fn()
    const onPause = vi.fn()

    createAnimationController({
      animationId: 'hero',
      debugLabel: 'hero-animation',
      onPlay,
      onPause,
    })

    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPause).not.toHaveBeenCalled()
  })

  it('pauses and resumes when overlay state changes', () => {
    const onPlay = vi.fn()
    const onPause = vi.fn()

    createAnimationController({
      animationId: 'carousel',
      onPlay,
      onPause,
    })

    expect(onPlay).toHaveBeenCalledTimes(1)

    setOverlayPauseState('navigation', true)
    expect(onPause).toHaveBeenCalledTimes(1)

    setOverlayPauseState('navigation', false)
    expect(onPlay).toHaveBeenCalledTimes(2)
  })

  it('respects persisted user preference across controller instances', () => {
    setAnimationPreference('computers', 'paused')

    const onPlay = vi.fn()
    const onPause = vi.fn()
    const controller = createAnimationController({
      animationId: 'computers',
      onPlay,
      onPause,
    })

    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onPlay).not.toHaveBeenCalled()

    controller.requestPlay()
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPause).toHaveBeenCalledTimes(1)

    controller.requestPause()
    expect(onPause).toHaveBeenCalledTimes(2)

    clearAnimationPreference('computers')
    expect(getAnimationPreference('computers')).toBeUndefined()
  })

  it('reacts to visibility changes', () => {
    const onPause = vi.fn()
    const onPlay = vi.fn()

    createAnimationController({
      animationId: 'testimonials',
      onPlay,
      onPause,
    })

    hiddenState = true
    dispatchVisibilityChange()
    expect(onPause).toHaveBeenCalledTimes(1)

    hiddenState = false
    dispatchVisibilityChange()
    expect(onPlay).toHaveBeenCalledTimes(2)
  })

  it('responds to reduced motion preference changes', () => {
    const onPause = vi.fn()
    const onPlay = vi.fn()

    createAnimationController({
      animationId: 'animations/hero',
      onPlay,
      onPause,
    })

    initAnimationLifecycle()

    dispatchReducedMotionChange(true)
    expect(onPause).toHaveBeenCalledTimes(1)

    dispatchReducedMotionChange(false)
    expect(onPlay).toHaveBeenCalledTimes(2)
  })

  it('pauses only the targeted instance when using instance pause sources', () => {
    const onPlayA = vi.fn()
    const onPauseA = vi.fn()
    const onPlayB = vi.fn()
    const onPauseB = vi.fn()

    const controllerA = createAnimationController({
      animationId: 'carousel',
      instanceId: 'carousel-a',
      onPlay: onPlayA,
      onPause: onPauseA,
    })

    createAnimationController({
      animationId: 'carousel',
      instanceId: 'carousel-b',
      onPlay: onPlayB,
      onPause: onPauseB,
    })

    expect(onPlayA).toHaveBeenCalledTimes(1)
    expect(onPlayB).toHaveBeenCalledTimes(1)

    controllerA.setInstancePauseState('focus-visible', true)
    expect(onPauseA).toHaveBeenCalledTimes(1)
    expect(onPauseB).toHaveBeenCalledTimes(0)

    controllerA.setInstancePauseState('focus-visible', false)
    expect(onPlayA).toHaveBeenCalledTimes(2)
    expect(onPlayB).toHaveBeenCalledTimes(1)
  })
})
