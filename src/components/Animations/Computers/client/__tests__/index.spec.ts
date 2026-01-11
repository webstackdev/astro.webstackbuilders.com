import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import ComputersAnimationAstro from '@components/Animations/Computers/index.astro'
import type { ComputersAnimationElement } from '@components/Animations/Computers/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import type {
  AnimationControllerConfig,
  AnimationControllerHandle,
} from '@components/scripts/store'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import { gsap } from 'gsap'

type ComputersAnimationModule = WebComponentModule<ComputersAnimationElement>
type ComputersClientModule = typeof import('@components/Animations/Computers/client')

let computersAnimationElementCtor: ComputersClientModule['ComputersAnimationElement'] | undefined
let registerComputersAnimationWebComponentFn:
  | ComputersClientModule['registerComputersAnimationWebComponent']
  | undefined
let computersWebComponentModule: ComputersClientModule['webComponentModule'] | undefined

const ensureComputersModuleLoaded = async (): Promise<void> => {
  if (
    computersAnimationElementCtor &&
    registerComputersAnimationWebComponentFn &&
    computersWebComponentModule
  ) {
    return
  }

  await withJsdomEnvironment(async () => {
    const module = await import('@components/Animations/Computers/client')
    computersAnimationElementCtor = module.ComputersAnimationElement
    registerComputersAnimationWebComponentFn = module.registerComputersAnimationWebComponent
    computersWebComponentModule = module.webComponentModule
  })
}

const getComputersModule = () => {
  if (
    !computersAnimationElementCtor ||
    !registerComputersAnimationWebComponentFn ||
    !computersWebComponentModule
  ) {
    throw new TestError('Computers animation module was not initialized correctly')
  }

  return {
    ComputersAnimationElement: computersAnimationElementCtor,
    registerComputersAnimationWebComponent: registerComputersAnimationWebComponentFn,
    webComponentModule: computersWebComponentModule,
  }
}

const addScriptBreadcrumbMock = vi.hoisted(() => vi.fn())
const handleScriptErrorMock = vi.hoisted(() => vi.fn())
const createAnimationControllerMock = vi.hoisted(() =>
  vi.fn(
    (_config: AnimationControllerConfig): AnimationControllerHandle => ({
      requestPlay: vi.fn(),
      requestPause: vi.fn(),
      clearUserPreference: vi.fn(),
      destroy: vi.fn(),
    })
  )
)

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: addScriptBreadcrumbMock,
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: handleScriptErrorMock,
}))

vi.mock('@components/scripts/store', () => ({
  createAnimationController: createAnimationControllerMock,
}))

vi.mock('gsap', () => ({
  gsap: {
    set: vi.fn(),
    timeline: vi.fn(),
  },
}))

type TimelineMock = ReturnType<typeof createTimelineMock>

const gsapMock = vi.mocked(gsap, true)
let container: AstroContainer
let timelineMock: TimelineMock
let intersectionObserverCallback: IntersectionObserverCallback | undefined

class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    intersectionObserverCallback = callback
  }
}

beforeAll(async () => {
  await ensureComputersModuleLoaded()
})

beforeEach(async () => {
  container = await AstroContainer.create()
  vi.clearAllMocks()
  timelineMock = createTimelineMock()
  gsapMock.timeline.mockImplementation(
    () => timelineMock as unknown as ReturnType<typeof gsap.timeline>
  )
  intersectionObserverCallback = undefined
  ;(
    globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
  ).IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver
})

describe('ComputersAnimation web component module', () => {
  it('exposes metadata required by the loader', () => {
    const {
      webComponentModule: module,
      ComputersAnimationElement: ctor,
      registerComputersAnimationWebComponent,
    } = getComputersModule()

    expect(module.registeredName).toBe('computers-animation')
    expect(module.componentCtor).toBe(ctor)
    expect(module.registerWebComponent).toBe(registerComputersAnimationWebComponent)
  })

  it('registers the custom element when window is available', async () => {
    const { registerComputersAnimationWebComponent, ComputersAnimationElement: ctor } =
      getComputersModule()

    await withJsdomEnvironment(async ({ window }) => {
      const tagName = 'computers-animation'
      registerComputersAnimationWebComponent(tagName)

      expect(window.customElements.get(tagName)).toBe(ctor)
    })
  })

  it('skips registration when window is unavailable', async () => {
    const { registerComputersAnimationWebComponent } = getComputersModule()

    await withJsdomEnvironment(async ({ window }) => {
      const globalRef = globalThis as { window?: Window }
      const originalWindow = globalRef.window
      const expectedTagName = generateUniqueTagName()
      delete globalRef.window

      try {
        registerComputersAnimationWebComponent(expectedTagName)
      } finally {
        if (originalWindow) {
          globalRef.window = originalWindow
        } else {
          delete globalRef.window
        }
      }

      expect(window.customElements.get(expectedTagName)).toBeUndefined()
    })
  })
})

describe('ComputersAnimationElement', () => {
  it('initializes the GSAP timeline when hero markup exists', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      const svg = element.querySelector('svg#heroAnimation')
      expect(svg).toBeTruthy()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(svg?.getAttribute('focusable')).toBe('false')

      expect(gsapMock.timeline).toHaveBeenCalledTimes(1)
      expect(timelineMock.timeScale).toHaveBeenCalledWith(3)
      expect(gsapMock.set).toHaveBeenCalledWith(
        '.monitorBottom',
        expect.objectContaining({ transformOrigin: '50% 100%' })
      )
      expect(createAnimationControllerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          animationId: 'computers-animation',
          debugLabel: 'ComputersAnimationElement',
          onPause: expect.any(Function),
          onPlay: expect.any(Function),
        })
      )
      expect(getBreadcrumbOperations()).toEqual(
        expect.arrayContaining(['initialize', 'startAnimation'])
      )
    })
  })

  it('pauses and resumes when lifecycle controller callbacks run', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      const controllerArgs = createAnimationControllerMock.mock.calls[0]?.[0]
      const pauseHandler = controllerArgs?.onPause
      const resumeHandler = controllerArgs?.onPlay
      const toggleButton = element.querySelector<HTMLButtonElement>('[data-animation-toggle]')

      pauseHandler?.()
      expect(element.getAttribute('data-animation-state')).toBe('paused')
      expect(toggleButton?.getAttribute('aria-pressed')).toBe('true')
      expect(toggleButton?.getAttribute('aria-label')).toBe('Play animation')
      resumeHandler?.()

      expect(timelineMock.pause).toHaveBeenCalled()
      expect(timelineMock.play).toHaveBeenCalled()
      expect(element.getAttribute('data-animation-state')).toBe('playing')
      expect(toggleButton?.getAttribute('aria-pressed')).toBe('false')
      expect(toggleButton?.getAttribute('aria-label')).toBe('Pause animation')
      expect(getBreadcrumbOperations()).toEqual(expect.arrayContaining(['pause', 'resume']))
    })
  })

  it('tears down resources on disconnect', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()
      element.disconnectedCallback()

      const controllerHandle = getLastControllerHandle()
      expect(controllerHandle?.destroy).toHaveBeenCalled()
      expect(timelineMock.kill).toHaveBeenCalled()
      expect(getBreadcrumbOperations()).toContain('teardown')
    })
  })

  it('is idempotent when initialized multiple times', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()
      element.initialize()

      expect(gsapMock.timeline).toHaveBeenCalledTimes(1)
    })
  })

  it('does not start animation when the hero markup is missing', async () => {
    await renderComputersAnimation(async ({ element, window }) => {
      window.document.getElementById('heroAnimation')?.remove()

      gsapMock.timeline.mockClear()
      gsapMock.set.mockClear()

      element.initialize()

      expect(gsapMock.timeline).not.toHaveBeenCalled()
      expect(gsapMock.set).not.toHaveBeenCalled()
    })
  })

  it('does not start the animation when it is hidden on the current viewport', async () => {
    await renderComputersAnimation(async ({ element, window }) => {
      const originalGetComputedStyle = window.getComputedStyle

      // The element auto-initializes via connectedCallback during rendering.
      // Tear it down so we can re-initialize with a mocked display:none state.
      element.disconnectedCallback()

      gsapMock.timeline.mockClear()
      gsapMock.set.mockClear()
      createAnimationControllerMock.mockClear()

      const getComputedStyleSpy = vi
        .spyOn(window, 'getComputedStyle')
        .mockReturnValue({ display: 'none' } as unknown as CSSStyleDeclaration)

      try {
        element.initialize()

        expect(gsapMock.timeline).not.toHaveBeenCalled()
        expect(createAnimationControllerMock).not.toHaveBeenCalled()
        expect(element.getAttribute('data-animation-state')).toBe('paused')
      } finally {
        getComputedStyleSpy.mockRestore()
        window.getComputedStyle = originalGetComputedStyle
      }
    })
  })

  it('delegates pause and resume helpers to the GSAP timeline', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      timelineMock.pause.mockClear()
      timelineMock.play.mockClear()

      element.pause()
      expect(element.getAttribute('data-animation-state')).toBe('paused')
      element.resume()

      expect(timelineMock.pause).toHaveBeenCalledTimes(1)
      expect(timelineMock.play).toHaveBeenCalledTimes(1)
      expect(element.getAttribute('data-animation-state')).toBe('playing')
    })
  })

  it('pauses when the element is not visible and resumes when it returns', async () => {
    await renderComputersAnimation(async ({ element, window }) => {
      void window
      element.initialize()

      expect(intersectionObserverCallback).toBeTypeOf('function')
      timelineMock.pause.mockClear()
      timelineMock.play.mockClear()

      intersectionObserverCallback?.(
        [
          {
            isIntersecting: false,
            intersectionRatio: 0,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )

      expect(timelineMock.pause).toHaveBeenCalledTimes(1)
      expect(element.getAttribute('data-animation-state')).toBe('playing')

      intersectionObserverCallback?.(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )

      expect(timelineMock.play).toHaveBeenCalledTimes(1)
    })
  })

  it('pauses when the page is hidden and resumes when visible again', async () => {
    await renderComputersAnimation(async ({ element, window }) => {
      element.initialize()

      timelineMock.pause.mockClear()
      timelineMock.play.mockClear()

      Object.defineProperty(window.document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })

      window.document.dispatchEvent(new window.Event('visibilitychange'))
      expect(timelineMock.pause).toHaveBeenCalledTimes(1)

      Object.defineProperty(window.document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })

      window.document.dispatchEvent(new window.Event('visibilitychange'))
      expect(timelineMock.play).toHaveBeenCalledTimes(1)
    })
  })

  it('requests pause and play through the animation controller when the toggle is clicked', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      const toggleButton = element.querySelector<HTMLButtonElement>('[data-animation-toggle]')
      const controllerHandle = getLastControllerHandle()

      expect(toggleButton).toBeTruthy()

      toggleButton?.click()
      expect(controllerHandle?.requestPause).toHaveBeenCalledTimes(1)

      element.pause()

      toggleButton?.click()
      expect(controllerHandle?.requestPlay).toHaveBeenCalledTimes(1)
    })
  })

  it('reports GSAP failures through the script error handler', async () => {
    const error = new TestError('gsap failed')
    gsapMock.set.mockImplementationOnce(() => {
      throw error
    })

    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      expect(handleScriptErrorMock).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'startAnimation',
          scriptName: 'ComputersAnimationElement',
        })
      )
    })
  })
})

interface RenderComputersAnimationContext {
  element: ComputersAnimationElement
  window: Window & typeof globalThis
  module: ComputersAnimationModule
}

type RenderComputersAnimationAssertion = (
  _context: RenderComputersAnimationContext
) => Promise<void> | void

const renderComputersAnimation = async (
  assertion: RenderComputersAnimationAssertion
): Promise<void> => {
  await executeRender<ComputersAnimationModule>({
    container,
    component: ComputersAnimationAstro,
    moduleSpecifier: '@components/Animations/Computers/client/index',
    selector: 'computers-animation',
    assert: async ({ element, module, window, renderResult }) => {
      if (!window) {
        throw new TestError('Computers animation tests require a DOM-capable window environment')
      }
      expect(renderResult).toContain(`<${module.registeredName}`)
      await assertion({ element, window: window as Window & typeof globalThis, module })
    },
  })
}

const getBreadcrumbOperations = (): string[] => {
  return addScriptBreadcrumbMock.mock.calls
    .map(([context]) => context?.operation)
    .filter((operation): operation is string => Boolean(operation))
}

function createTimelineMock() {
  const timeline = {
    timeScale: vi.fn(),
    from: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    kill: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
  }

  timeline.timeScale.mockReturnValue(timeline)
  timeline.from.mockReturnValue(timeline)
  timeline.to.mockReturnValue(timeline)
  timeline.set.mockReturnValue(timeline)

  return timeline
}

const generateUniqueTagName = (): string =>
  `computers-animation-${Math.random().toString(36).slice(2)}`

const getLastControllerHandle = (): AnimationControllerHandle | undefined =>
  createAnimationControllerMock.mock.results.at(-1)?.value
