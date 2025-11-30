
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import ComputersAnimationAstro from '@components/Animations/Computers/index.astro'
import type { ComputersAnimationElement } from '@components/Animations/Computers/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import type { AnimationControllerConfig, AnimationControllerHandle } from '@components/scripts/store'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import { gsap } from 'gsap'

type ComputersAnimationModule = WebComponentModule<ComputersAnimationElement>
type ComputersClientModule = typeof import('@components/Animations/Computers/client')

let computersAnimationElementCtor: ComputersClientModule['ComputersAnimationElement'] | undefined
let registerComputersAnimationWebComponentFn: ComputersClientModule['registerComputersAnimationWebComponent'] | undefined
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
  vi.fn((_config: AnimationControllerConfig): AnimationControllerHandle => ({
    requestPlay: vi.fn(),
    requestPause: vi.fn(),
    clearUserPreference: vi.fn(),
    destroy: vi.fn(),
  }))
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

beforeAll(async () => {
  await ensureComputersModuleLoaded()
})

beforeEach(async () => {
  container = await AstroContainer.create()
  vi.clearAllMocks()
  timelineMock = createTimelineMock()
  gsapMock.timeline.mockImplementation(() => timelineMock as unknown as ReturnType<typeof gsap.timeline>)
})

describe('ComputersAnimation web component module', () => {
  it('exposes metadata required by the loader', () => {
    const { webComponentModule: module, ComputersAnimationElement: ctor, registerComputersAnimationWebComponent } =
      getComputersModule()

    expect(module.registeredName).toBe('computers-animation')
    expect(module.componentCtor).toBe(ctor)
    expect(module.registerWebComponent).toBe(registerComputersAnimationWebComponent)
  })

  it('registers the custom element when window is available', async () => {
    const { registerComputersAnimationWebComponent, ComputersAnimationElement: ctor } = getComputersModule()

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

      expect(gsapMock.timeline).toHaveBeenCalledTimes(1)
      expect(timelineMock.timeScale).toHaveBeenCalledWith(3)
      expect(gsapMock.set).toHaveBeenCalledWith(
        '.monitorBottom',
        expect.objectContaining({ transformOrigin: '50% 100%' }),
      )
      expect(createAnimationControllerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          animationId: 'computers-animation',
          debugLabel: 'ComputersAnimationElement',
          onPause: expect.any(Function),
          onPlay: expect.any(Function),
        }),
      )
      expect(getBreadcrumbOperations()).toEqual(expect.arrayContaining(['initialize', 'startAnimation']))
    })
  })

  it('pauses and resumes when lifecycle controller callbacks run', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      const controllerArgs = createAnimationControllerMock.mock.calls[0]?.[0]
      const pauseHandler = controllerArgs?.onPause
      const resumeHandler = controllerArgs?.onPlay

      pauseHandler?.()
      resumeHandler?.()

      expect(timelineMock.pause).toHaveBeenCalled()
      expect(timelineMock.play).toHaveBeenCalled()
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

  it('delegates pause and resume helpers to the GSAP timeline', async () => {
    await renderComputersAnimation(async ({ element }) => {
      element.initialize()

      element.pause()
      element.resume()

      expect(timelineMock.pause).toHaveBeenCalledTimes(1)
      expect(timelineMock.play).toHaveBeenCalledTimes(1)
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
        expect.objectContaining({ operation: 'startAnimation', scriptName: 'ComputersAnimationElement' }),
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
  _context: RenderComputersAnimationContext,
) => Promise<void> | void

const renderComputersAnimation = async (
  assertion: RenderComputersAnimationAssertion,
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

      forceDocumentReady(window)
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

const forceDocumentReady = (window: Window & typeof globalThis): void => {
  const { document } = window
  if (document.readyState === 'complete') return

  try {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    })
  } catch {
    // best effort only
  }

  document.dispatchEvent(new window.Event('DOMContentLoaded'))
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

const generateUniqueTagName = (): string => `computers-animation-${Math.random().toString(36).slice(2)}`

const getLastControllerHandle = (): AnimationControllerHandle | undefined =>
  createAnimationControllerMock.mock.results.at(-1)?.value
