import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import type { AnimationControllerConfig, AnimationControllerHandle } from '@components/scripts/store'
import { executeRender, withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import ConfettiAstro from '@components/Animations/Confetti/index.astro'
import type { ConfettiAnimationElement } from '@components/Animations/Confetti/client'

type ConfettiModule = WebComponentModule<ConfettiAnimationElement>

type ConfettiClientModule = typeof import('@components/Animations/Confetti/client')

let confettiElementCtor: ConfettiClientModule['ConfettiAnimationElement'] | undefined
let registerConfettiAnimationWebComponentFn: ConfettiClientModule['registerConfettiAnimationWebComponent'] | undefined
let confettiWebComponentModule: ConfettiClientModule['webComponentModule'] | undefined

const ensureConfettiModuleLoaded = async (): Promise<void> => {
  if (confettiElementCtor && registerConfettiAnimationWebComponentFn && confettiWebComponentModule) {
    return
  }

  await withJsdomEnvironment(async () => {
    const module = await import('@components/Animations/Confetti/client')
    confettiElementCtor = module.ConfettiAnimationElement
    registerConfettiAnimationWebComponentFn = module.registerConfettiAnimationWebComponent
    confettiWebComponentModule = module.webComponentModule
  })
}

const getConfettiModule = () => {
  if (!confettiElementCtor || !registerConfettiAnimationWebComponentFn || !confettiWebComponentModule) {
    throw new Error('Confetti module was not initialized correctly')
  }

  return {
    ConfettiAnimationElement: confettiElementCtor,
    registerConfettiAnimationWebComponent: registerConfettiAnimationWebComponentFn,
    webComponentModule: confettiWebComponentModule,
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

const confettiInstanceMock = vi.hoisted(() => vi.fn())
const confettiCreateMock = vi.hoisted(() => vi.fn(() => confettiInstanceMock))

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: addScriptBreadcrumbMock,
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: handleScriptErrorMock,
}))

vi.mock('@components/scripts/store', () => ({
  createAnimationController: createAnimationControllerMock,
}))

vi.mock('canvas-confetti', () => ({
  create: confettiCreateMock,
}))

let container: AstroContainer

beforeAll(async () => {
  await ensureConfettiModuleLoaded()
})

beforeEach(async () => {
  container = await AstroContainer.create()
  vi.clearAllMocks()
})

describe('Confetti web component module', () => {
  it('exposes metadata required by the loader', () => {
    const { webComponentModule: module, ConfettiAnimationElement: ctor, registerConfettiAnimationWebComponent } =
      getConfettiModule()

    expect(module.registeredName).toBe('confetti-animation')
    expect(module.componentCtor).toBe(ctor)
    expect(module.registerWebComponent).toBe(registerConfettiAnimationWebComponent)
  })

  it('registers the custom element when window is available', async () => {
    const { registerConfettiAnimationWebComponent, ConfettiAnimationElement: ctor } = getConfettiModule()

    await withJsdomEnvironment(async ({ window }) => {
      const tagName = 'confetti-animation'
      registerConfettiAnimationWebComponent(tagName)
      expect(window.customElements.get(tagName)).toBe(ctor)
    })
  })
})

describe('ConfettiAnimationElement', () => {
  const renderConfetti = async (
    assertion: (_context: { element: ConfettiAnimationElement }) => Promise<void> | void,
  ): Promise<void> => {
    await executeRender<ConfettiModule>({
      container,
      component: ConfettiAstro,
      moduleSpecifier: '@components/Animations/Confetti/client/index',
      args: {},
      waitForReady: async (element) => {
        await element.updateComplete
      },
      assert: async ({ element, module, renderResult }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)
        await assertion({ element })
      },
    })
  }

  it('creates an animation controller on initialize', async () => {
    await renderConfetti(async ({ element }) => {
      element.initialize()

      expect(createAnimationControllerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          animationId: 'confetti-animation',
          debugLabel: 'ConfettiAnimationElement',
          onPause: expect.any(Function),
          onPlay: expect.any(Function),
        }),
      )
    })
  })

  it('creates a canvas-confetti instance and fires when allowed', async () => {
    await renderConfetti(async ({ element }) => {
      element.initialize()
      element.fire()

      expect(confettiCreateMock).toHaveBeenCalledTimes(1)
      expect(confettiInstanceMock).toHaveBeenCalledTimes(1)

      const args = confettiInstanceMock.mock.calls[0]?.[0]
      expect(args).toEqual(
        expect.objectContaining({
          particleCount: expect.any(Number),
          spread: expect.any(Number),
          startVelocity: expect.any(Number),
        }),
      )
    })
  })

  it('skips firing when controller pauses animations', async () => {
    await renderConfetti(async ({ element }) => {
      element.initialize()

      const controllerArgs = createAnimationControllerMock.mock.calls[0]?.[0]
      controllerArgs?.onPause()

      element.fire()
      expect(confettiInstanceMock).not.toHaveBeenCalled()

      controllerArgs?.onPlay()

      element.fire()
      expect(confettiInstanceMock).toHaveBeenCalledTimes(1)
    })
  })

  it('fires in response to a confetti:fire event', async () => {
    await renderConfetti(async ({ element }) => {
      element.initialize()

      element.dispatchEvent(
        new CustomEvent('confetti:fire', {
          detail: { particleCount: 12 },
        }),
      )

      expect(confettiInstanceMock).toHaveBeenCalledTimes(1)
      expect(confettiInstanceMock).toHaveBeenCalledWith(expect.objectContaining({ particleCount: 12 }))
    })
  })
})
