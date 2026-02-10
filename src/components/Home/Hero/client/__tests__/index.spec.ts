import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import {
  __resetAnimationLifecycleForTests,
  clearAnimationPreference,
  getAnimationPreference,
} from '@components/scripts/store'

import { READY_TEXT } from '../index'
const STEP_MS = 500

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

      const { registerHomeHeroWebComponent } = await import('@components/Home/Hero/client')
      await registerHomeHeroWebComponent()

      window.document.body.innerHTML = await renderHero()

      const readyText = window.document.querySelector<HTMLElement>('[data-hero-ready-text]')
      expect(readyText).toBeTruthy()
      expect(readyText?.textContent).toBe('')

      vi.advanceTimersByTime(STEP_MS)
      expect(readyText?.textContent).toBe('r')

      vi.advanceTimersByTime(STEP_MS)
      expect(readyText?.textContent).toBe('re')

      vi.advanceTimersByTime(STEP_MS * (READY_TEXT.length - 2))
      expect(readyText?.textContent).toBe(READY_TEXT)

      vi.advanceTimersByTime(STEP_MS * 5)
      expect(readyText?.textContent).toBe(READY_TEXT)

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

      const { registerHomeHeroWebComponent } = await import('@components/Home/Hero/client')
      await registerHomeHeroWebComponent()

      window.document.body.innerHTML = await renderHero()

      const readyText = window.document.querySelector<HTMLElement>('[data-hero-ready-text]')
      expect(readyText).toBeTruthy()
      expect(readyText?.textContent).toBe(READY_TEXT)

      vi.advanceTimersByTime(STEP_MS * READY_TEXT.length)
      expect(readyText?.textContent).toBe(READY_TEXT)

      clearAnimationPreference('home-hero-ready')
      expect(getAnimationPreference('home-hero-ready')).toBeUndefined()
    })
  })
})
