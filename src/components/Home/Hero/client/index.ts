import { LitElement } from 'lit'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  createAnimationController,
  type AnimationControllerHandle,
  type AnimationPlayState,
} from '@components/scripts/store'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { queryHeroReadyTextElement } from './selectors'

const SCRIPT_NAME = 'HomeHeroElement'

export const READY_TEXT = "heck yes, let's talk..."
const READY_DELAY_MS = 500

export class HomeHeroElement extends LitElement {
  static registeredName = 'home-hero'

  private initialized = false
  private readyTextElement: HTMLSpanElement | null = null
  private animationController: AnimationControllerHandle | undefined
  private timeoutId: number | null = null
  private currentIndex = 0
  private completed = false
  private renderContainer: HTMLDivElement | undefined

  protected override createRenderRoot() {
    // Preserve server-rendered HTML inside the element.
    // Lit needs a render root, so we render into a hidden container that does not affect layout.
    if (!this.renderContainer) {
      this.renderContainer = document.createElement('div')
      this.renderContainer.setAttribute('data-lit-root', '')
      this.renderContainer.style.display = 'none'
      this.appendChild(this.renderContainer)
    }

    return this.renderContainer
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.initialize()
  }

  override disconnectedCallback(): void {
    this.teardown()
    super.disconnectedCallback()
  }

  private initialize(): void {
    if (this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.readyTextElement = queryHeroReadyTextElement(this)

      if (!this.readyTextElement) {
        this.initialized = true
        return
      }

      // Baseline state: show prompt only until we decide to animate.
      this.readyTextElement.textContent = ''

      this.animationController = createAnimationController({
        animationId: 'home-hero-ready',
        debugLabel: SCRIPT_NAME,
        defaultState: 'playing',
        onPlay: () => {
          this.handlePlay()
        },
        onPause: () => {
          this.handlePause()
        },
      })

      this.initialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private teardown(): void {
    this.clearTimeout()
    this.animationController?.destroy()
    this.animationController = undefined
    this.initialized = false
    this.readyTextElement = null
    this.currentIndex = 0
    this.completed = false
  }

  private handlePlay(): void {
    if (this.completed) return
    if (!this.readyTextElement) return
    if (this.timeoutId !== null) return

    this.currentIndex = 0
    this.readyTextElement.textContent = ''
    this.scheduleNextTick()
  }

  private handlePause(): void {
    if (this.completed) return
    if (!this.readyTextElement) return

    this.clearTimeout()
    this.readyTextElement.textContent = READY_TEXT
    this.completed = true
  }

  private scheduleNextTick(): void {
    if (!this.readyTextElement) return

    this.timeoutId = window.setTimeout(() => {
      this.timeoutId = null
      this.currentIndex += 1

      this.readyTextElement!.textContent = READY_TEXT.slice(0, this.currentIndex)

      if (this.currentIndex >= READY_TEXT.length) {
        this.completed = true
        return
      }

      this.scheduleNextTick()
    }, READY_DELAY_MS)
  }

  private clearTimeout(): void {
    if (this.timeoutId === null) return
    window.clearTimeout(this.timeoutId)
    this.timeoutId = null
  }
}

export const registerWebComponent = async (tagName = HomeHeroElement.registeredName) => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, HomeHeroElement)
}

export const registerHomeHeroWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<HomeHeroElement> = {
  registeredName: HomeHeroElement.registeredName,
  componentCtor: HomeHeroElement,
  registerWebComponent,
}

export type { AnimationPlayState }
