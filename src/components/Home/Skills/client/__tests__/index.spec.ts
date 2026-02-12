import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import SkillsFixture from '@components/Home/Skills/client/__fixtures__/skillsCarousel.fixture.astro'
import type { SkillsCarouselElement } from '@components/Home/Skills/client'

type SkillsModule = WebComponentModule<SkillsCarouselElement>

const addButtonEventListenersMock = vi.hoisted(() => vi.fn())
const createAnimationControllerMock = vi.hoisted(() => vi.fn())

type AutoplayPluginInstance = {
  play: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

const autoplayPluginInstances: AutoplayPluginInstance[] = []

const createAutoplayPluginMock = vi.fn(() => {
  const instance: AutoplayPluginInstance = {
    play: vi.fn(),
    stop: vi.fn(),
  }
  autoplayPluginInstances.push(instance)
  return instance
})

vi.mock('astro:content', () => {
  const skills = [
    {
      data: {
        slug: 'aws',
        displayName: 'AWS',
        logo: undefined,
        isSkill: true,
      },
    },
    {
      data: {
        slug: 'kubernetes',
        displayName: 'Kubernetes',
        logo: undefined,
        isSkill: true,
      },
    },
    {
      data: {
        slug: 'terraform',
        displayName: 'Terraform',
        logo: undefined,
        isSkill: true,
      },
    },
  ]

  return {
    getCollection: vi.fn(async (_collection: string, filter?: (_entry: unknown) => boolean) => {
      if (!filter) return skills
      return skills.filter(entry => filter(entry))
    }),
  }
})

vi.mock('@components/scripts/store', () => ({
  createAnimationController: createAnimationControllerMock,
}))

vi.mock('@components/scripts/elementListeners', () => ({
  addButtonEventListeners: addButtonEventListenersMock,
}))

vi.mock('embla-carousel', () => {
  const createEmbla = vi.fn(() => {
    const handlers = new Map<string, Array<() => void>>()
    let selectedIndex = 0

    const api = {
      canScrollPrev: vi.fn(() => false),
      canScrollNext: vi.fn(() => false),
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      on: vi.fn((event: string, handler: () => void) => {
        const existing = handlers.get(event) ?? []
        handlers.set(event, [...existing, handler])
        return api
      }),
      off: vi.fn((event: string, handler: () => void) => {
        const existing = handlers.get(event) ?? []
        handlers.set(
          event,
          existing.filter(entry => entry !== handler)
        )
        return api
      }),
      destroy: vi.fn(),
      scrollSnapList: vi.fn(() => [0, 1, 2]),
      selectedScrollSnap: vi.fn(() => selectedIndex),
      scrollTo: vi.fn((index: number) => {
        selectedIndex = index
      }),
    }

    return api
  })

  return {
    default: createEmbla,
  }
})

vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: createAutoplayPluginMock,
}))

describe('Skills carousel component', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    vi.clearAllMocks()
    autoplayPluginInstances.length = 0
    createAutoplayPluginMock.mockClear()
    createAnimationControllerMock.mockReturnValue({
      requestPlay: vi.fn(),
      requestPause: vi.fn(),
      setInstancePauseState: vi.fn(),
      clearUserPreference: vi.fn(),
      destroy: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const renderSkills = async (
    assertion: (_context: { element: SkillsCarouselElement }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<SkillsModule>({
      container,
      component: SkillsFixture,
      moduleSpecifier: '@components/Home/Skills/client/index',
      selector: 'skills-carousel',
      waitForReady: async (element: SkillsCarouselElement) => {
        await element.updateComplete
      },
      assert: async ({ element, module, renderResult }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        await assertion({ element })
      },
    })
  }

  it('renders centered labels with nav controls and no dots', async () => {
    await renderSkills(async ({ element }) => {
      const firstLink = element.querySelector('a')
      expect(firstLink?.classList.contains('flex-col')).toBe(true)
      expect(firstLink?.classList.contains('items-center')).toBe(true)
      expect(firstLink?.classList.contains('text-center')).toBe(true)

      expect(element.querySelector('[data-skills-prev]')).toBeTruthy()
      expect(element.querySelector('[data-skills-next]')).toBeTruthy()
      expect(element.querySelector('[data-skills-autoplay-toggle]')).toBeTruthy()
      expect(element.querySelector('[data-skills-dots]')).toBeFalsy()
    })
  })

  it('toggles autoplay state via the play/pause control', async () => {
    vi.useFakeTimers()
    const buttonHandlers = new Map<Element, () => void>()
    addButtonEventListenersMock.mockImplementation((button, handler) => {
      buttonHandlers.set(button as Element, handler as () => void)
    })

    await renderSkills(async ({ element }) => {
      const toggle = element.querySelector('[data-skills-autoplay-toggle]') as HTMLButtonElement
      expect(toggle).toBeTruthy()

      const handler = buttonHandlers.get(toggle)
      expect(handler).toBeTruthy()

      const autoplayInstance = autoplayPluginInstances[0]
      expect(autoplayInstance).toBeTruthy()

      vi.runAllTimers()
      expect(autoplayInstance?.play).toHaveBeenCalled()
      expect(toggle.getAttribute('aria-label')).toBe('Pause skills')

      handler?.()
      expect(autoplayInstance?.stop).toHaveBeenCalled()
      expect(toggle.getAttribute('aria-label')).toBe('Play skills')

      handler?.()
      vi.runAllTimers()
      expect(autoplayInstance?.play).toHaveBeenCalled()
      expect(toggle.getAttribute('aria-label')).toBe('Pause skills')
    })
  })
})