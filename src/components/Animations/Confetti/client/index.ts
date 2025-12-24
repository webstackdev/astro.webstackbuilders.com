import { LitElement } from 'lit'
import { create as createConfetti } from 'canvas-confetti'
import type { Shape as ConfettiShape } from 'canvas-confetti'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  createAnimationController,
  type AnimationControllerHandle,
} from '@components/scripts/store'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { queryConfettiCanvas } from './selectors'

const SCRIPT_NAME = 'ConfettiAnimationElement'
const COMPONENT_TAG_NAME = 'confetti-animation'

export type ConfettiOrigin = {
  /**
   * The x position on the page, with 0 being the left edge and 1 being the right edge (default: 0.5)
   */
  x: number
  /**
   * The y position on the page, with 0 being the top edge and 1 being the bottom edge (default: 0.5)
   */
  y: number
}

export type ConfettiFireOptions = {
  /**
   * Where to start firing confetti from
   */
  origin?: ConfettiOrigin

  /**
   * The number of confetti to launch
   */
  particleCount?: number

  /**
   * How far off center the confetti can go, in degrees. 70 means the confetti
   * will launch at the defined angle plus or minus 35 degrees (default: 70).
   */
  spread?: number

  /**
   * How fast the confetti will start going, in pixels (default: 45)
   */
  startVelocity?: number

  /**
   * Scale factor for each confetti particle. Use decimals to make the confetti
   * smaller. (default: 1)
   */
  scalar?: number

  /**
   * An array of color strings in HEX format, e.g. `#bada55`.
   *
   * Default: `canvas-confetti`'s built-in colors.
   */
  colors?: string[]

  /**
   * An array of shapes for the confetti.
   * Built-ins: `square`, `circle`, `star`.
   * Custom shapes can be created via `shapeFromPath` / `shapeFromText` from `canvas-confetti`.
   *
   * Default: `['square', 'circle']`.
   */
  shapes?: ConfettiShape[]
}

type ConfettiInstance = ReturnType<typeof createConfetti>

export class ConfettiAnimationElement extends LitElement {
  private initialized = false
  private animationController: AnimationControllerHandle | undefined
  private canAnimate = true
  private confettiInstance: ConfettiInstance | undefined

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value))
  }

  private getOriginFromElement(element: Element): ConfettiOrigin | undefined {
    if (typeof window === 'undefined') return

    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (!viewportWidth || !viewportHeight) return

    const originX = (rect.left + rect.width / 2) / viewportWidth
    const originY = (rect.top + rect.height) / viewportHeight

    return {
      x: this.clamp01(originX),
      y: this.clamp01(originY),
    }
  }

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
        particleCount = 50,
        spread = 70,
        startVelocity = 45,
        scalar = 1,
        colors,
        shapes = ['square', 'circle'],
      } = options

      void this.confettiInstance({
        particleCount,
        spread,
        startVelocity,
        scalar,
        origin,
        colors,
        shapes,
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private registerFireListener(): void {
    this.addEventListener('confetti:fire', (event) => {
      const detail = (event as CustomEvent<ConfettiFireOptions | undefined>).detail

      const target = event.target
      const elementTarget = target instanceof Element ? target : undefined
      const originFromTarget = elementTarget ? this.getOriginFromElement(elementTarget) : undefined

      const originToUse = detail?.origin ?? originFromTarget

      if (originToUse) {
        this.fire({
          ...(detail ?? {}),
          origin: originToUse,
        })

        return
      }

      this.fire(detail ?? {})
    })
  }

  private ensureConfettiInstance(): void {
    if (typeof window === 'undefined') return
    if (this.confettiInstance) return

    const canvas = queryConfettiCanvas(this)
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
