import { LitElement } from 'lit'
import { create as createConfetti } from 'canvas-confetti'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  createAnimationController,
  type AnimationControllerHandle,
} from '@components/scripts/store'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

const SCRIPT_NAME = 'ConfettiAnimationElement'
const COMPONENT_TAG_NAME = 'confetti-animation'
const CANVAS_SELECTOR = '[data-confetti-canvas]'

export type ConfettiOrigin = {
  x: number
  y: number
}

export type ConfettiFireOptions = {
  origin?: ConfettiOrigin
  particleCount?: number
  spread?: number
  startVelocity?: number
  scalar?: number
}

type ConfettiInstance = ReturnType<typeof createConfetti>

export class ConfettiAnimationElement extends LitElement {
  private initialized = false
  private animationController: AnimationControllerHandle | undefined
  private canAnimate = true
  private confettiInstance: ConfettiInstance | undefined

  private readonly domReadyHandler = () => {
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
    this.initialize()
  }

  override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (typeof document === 'undefined') return

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.domReadyHandler)
      return
    }

    this.initialize()
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.teardown()
    }

    super.disconnectedCallback()
  }

  initialize(): void {
    if (this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.registerFireListener()
      this.ensureConfettiInstance()

      this.animationController = createAnimationController({
        animationId: 'confetti-animation',
        debugLabel: SCRIPT_NAME,
        // Reduced motion and global pause should only be respected via the store.
        defaultState: 'playing',
        onPause: () => {
          this.canAnimate = false
        },
        onPlay: () => {
          this.canAnimate = true
        },
      })

      this.initialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Trigger a one-shot confetti burst.
   *
   * If animations are globally paused (including reduced motion), this is a no-op.
   */
  fire(options: ConfettiFireOptions = {}): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'fire' }
    addScriptBreadcrumb(context)

    try {
      if (!this.canAnimate) return
      this.ensureConfettiInstance()
      if (!this.confettiInstance) return

      const {
        origin,
        particleCount = 140,
        spread = 70,
        startVelocity = 45,
        scalar = 1,
      } = options

      void this.confettiInstance({
        particleCount,
        spread,
        startVelocity,
        scalar,
        origin,
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private registerFireListener(): void {
    this.addEventListener('confetti:fire', (event) => {
      const detail = (event as CustomEvent<ConfettiFireOptions | undefined>).detail
      this.fire(detail ?? {})
    })
  }

  private ensureConfettiInstance(): void {
    if (typeof window === 'undefined') return
    if (this.confettiInstance) return

    const canvas = this.querySelector(CANVAS_SELECTOR) as HTMLCanvasElement | null
    if (!canvas) return

    // Prefer a per-canvas instance so callers can place the canvas where they want.
    this.confettiInstance = createConfetti(canvas, {
      resize: true,
      useWorker: true,
    })
  }

  private teardown(): void {
    if (!this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'teardown' }
    addScriptBreadcrumb(context)

    try {
      this.animationController?.destroy()
      this.animationController = undefined
      this.confettiInstance = undefined
      this.canAnimate = true
      this.initialized = false
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

export const registerWebComponent = async (tagName = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, ConfettiAnimationElement)
}

export const registerConfettiAnimationWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<ConfettiAnimationElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ConfettiAnimationElement,
  registerWebComponent,
}
