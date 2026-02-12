import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import {
  __resetAnimationLifecycleForTests,
  clearAnimationPreference,
  getAnimationPreference,
  initAnimationLifecycle,
} from '@components/scripts/store'

const STEP_MS = 500

const syncWindowTimers = (window: Window): void => {
  window.setTimeout = globalThis.setTimeout.bind(globalThis) as typeof window.setTimeout
  window.clearTimeout = globalThis.clearTimeout.bind(globalThis) as typeof window.clearTimeout
}

describe('HomeHeroElement (Lit)', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  afterEach(() => {
    vi.useRealTimers()
    __resetAnimationLifecycleForTests()
  })

  const renderHero = async (): Promise<string> => {
    const Hero = (await import('@components/Home/Hero/index.astro')).default

    return container.renderToString(Hero, {
      props: {
        pretitle: 'Test pretitle',
        benefits: ['One', 'Two', 'Three'],
      },
    })
  }

  test('types the ready prompt one character every 500ms and stops when complete', async () => {
    vi.useFakeTimers()

    await withJsdomEnvironment(async ({ window }) => {
      window.matchMedia = (() =>
        ({
          matches: false,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia
      syncWindowTimers(window)

      const { registerHomeHeroWebComponent, READY_TEXT: readyTextValue } = await import(
        '@components/Home/Hero/client'
      )
      await registerHomeHeroWebComponent()

      window.document.body.innerHTML = await renderHero()

      const readyTextLength = readyTextValue.length

      const readyText = window.document.querySelector<HTMLElement>('[data-hero-ready-text]')
      expect(readyText).toBeTruthy()
      expect(readyText?.textContent).toBe('')

      vi.advanceTimersByTime(STEP_MS)
      expect(readyText?.textContent?.length ?? 0).toBe(1)

      vi.advanceTimersByTime(STEP_MS)
      expect(readyText?.textContent?.length ?? 0).toBe(2)

      vi.advanceTimersByTime(STEP_MS * (readyTextLength - 2))
      const completedText = readyText?.textContent ?? ''
      expect(completedText.length).toBe(readyTextLength)
      expect(completedText.length).toBeGreaterThanOrEqual(5)

      vi.advanceTimersByTime(STEP_MS * 5)
      const finalText = readyText?.textContent ?? ''
      expect(finalText.length).toBe(readyTextLength)
      expect(finalText.length).toBeGreaterThanOrEqual(5)

      expect(getAnimationPreference('home-hero-ready')).toBeUndefined()
    })
  })

  test('skips animation and shows final text when reduced motion is preferred', async () => {
    vi.useFakeTimers()

    await withJsdomEnvironment(async ({ window }) => {
      window.matchMedia = (() =>
        ({
          matches: true,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia
      syncWindowTimers(window)

      initAnimationLifecycle()

      const { registerHomeHeroWebComponent, READY_TEXT: readyTextValue } = await import(
        '@components/Home/Hero/client'
      )
      await registerHomeHeroWebComponent()

      window.document.body.innerHTML = await renderHero()

      const readyTextLength = readyTextValue.length

      const readyText = window.document.querySelector<HTMLElement>('[data-hero-ready-text]')
      expect(readyText).toBeTruthy()
      const initialText = readyText?.textContent ?? ''
      expect(initialText.length).toBe(readyTextLength)
      expect(initialText.length).toBeGreaterThanOrEqual(5)

      vi.advanceTimersByTime(STEP_MS * readyTextLength)
      const finalText = readyText?.textContent ?? ''
      expect(finalText.length).toBe(readyTextLength)
      expect(finalText.length).toBeGreaterThanOrEqual(5)

      clearAnimationPreference('home-hero-ready')
      expect(getAnimationPreference('home-hero-ready')).toBeUndefined()
    })
  })
})
