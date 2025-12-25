import { LitElement } from 'lit'
import { gsap } from 'gsap'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import {
  createAnimationController,
  type AnimationControllerHandle,
  type AnimationPlayState,
} from '@components/scripts/store'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  queryAnimationToggleButton,
  queryAnimationTogglePauseIcon,
  queryAnimationTogglePlayIcon,
} from './selectors'

const SCRIPT_NAME = 'ComputersAnimationElement'
const COMPONENT_TAG_NAME = 'computers-animation'

type Timeline = ReturnType<typeof gsap.timeline>

const cnst = () => {
  const tenPercentBounce = 1.70158
  return tenPercentBounce * 1.525
}

const Anticipate = {
  out(p: number) {
    return (p *= 2) < 1
      ? 0.5 * p * p * ((cnst() + 1) * p - cnst())
      : 0.5 * (2 - Math.pow(2, -10 * (p - 1)))
  },
  in(p: number) {
    return (p *= 2) < 1
      ? 0.5 * (Math.pow(2, 10 * (p - 1)) - 0.001)
      : 0.5 * ((p -= 2) * p * ((cnst() + 1) * p + cnst()) + 2)
  },
  inOut(p: number) {
    return (p *= 2) < 1
      ? 0.5 * p * p * ((cnst() + 1) * p - cnst())
      : 0.5 * ((p -= 2) * p * ((cnst() + 1) * p + cnst()) + 2)
  },
} as const

export class ComputersAnimationElement extends LitElement {
  private timeline: Timeline | null = null
  private initialized = false
  private animationController: AnimationControllerHandle | undefined
  private toggleButton: HTMLButtonElement | null = null
  private intersectionObserver: IntersectionObserver | undefined
  private isInViewport = true
  private isPageVisible = true
  private readonly domReadyHandler = () => {
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
    this.initialize()
  }
  private readonly visibilityChangeHandler = () => {
    try {
      if (typeof document === 'undefined') return
      this.isPageVisible = document.visibilityState !== 'hidden'
      this.syncPlaybackWithVisibility()
    } catch {
      // Best effort only
    }
  }
  private readonly toggleClickHandler = (event: Event) => {
    this.handleToggleClick(event)
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
      this.startAnimation()
      this.toggleButton = queryAnimationToggleButton(this)

      if (this.toggleButton) {
        addButtonEventListeners(this.toggleButton, this.toggleClickHandler, this)
      }

      const defaultState = this.getDefaultAnimationState()
      this.setAnimationState(defaultState)
      if (defaultState === 'paused') {
        this.timeline?.pause(0)
      }

      this.animationController = createAnimationController({
        animationId: 'computers-animation',
        debugLabel: SCRIPT_NAME,
        defaultState,
        onPause: () => {
          this.pause()
        },
        onPlay: () => {
          this.resume()
        },
      })

      this.setupVisibilityHandlers()
      this.syncPlaybackWithVisibility()
      this.initialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  pause(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'pause' }
    addScriptBreadcrumb(context)

    try {
      this.timeline?.pause()
      this.setAnimationState('paused')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  resume(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'resume' }
    addScriptBreadcrumb(context)

    try {
      this.setAnimationState('playing')
      this.syncPlaybackWithVisibility()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupVisibilityHandlers(): void {
    if (typeof document === 'undefined') return

    try {
      this.isPageVisible = document.visibilityState !== 'hidden'
      document.addEventListener('visibilitychange', this.visibilityChangeHandler)

      const IntersectionObserverCtor = (
        globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
      ).IntersectionObserver

      if (typeof IntersectionObserverCtor !== 'function') {
        return
      }

      this.intersectionObserver = new IntersectionObserverCtor(
        (entries) => {
          const entry = entries[0]
          const ratio = entry?.intersectionRatio ?? 0
          // Pause as soon as the element is even partially out of view.
          // Only consider it "in viewport" when it is fully visible.
          this.isInViewport = Boolean(entry?.isIntersecting && ratio >= 0.999)
          this.syncPlaybackWithVisibility()
        },
        { threshold: [0, 0.999] },
      )

      this.intersectionObserver.observe(this)
    } catch {
      // Best effort only
    }
  }

  private teardownVisibilityHandlers(): void {
    try {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      }

      this.intersectionObserver?.disconnect()
      this.intersectionObserver = undefined
      this.isInViewport = true
      this.isPageVisible = true
    } catch {
      // Best effort only
    }
  }

  private syncPlaybackWithVisibility(): void {
    if (!this.timeline) return

    try {
      if (!this.isPageVisible || !this.isInViewport) {
        this.timeline.pause()
        return
      }

      if (this.getAnimationState() === 'playing') {
        this.timeline.play()
      }
    } catch {
      // Best effort only
    }
  }

  private teardown(): void {
    if (!this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'teardown' }
    addScriptBreadcrumb(context)

    try {
      this.teardownVisibilityHandlers()
      this.animationController?.destroy()
      this.animationController = undefined

      if (this.timeline) {
        this.timeline.kill()
        this.timeline = null
      }

      this.resetToggleButton()
      this.removeAttribute('data-animation-state')
      this.initialized = false
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setAnimationState(state: AnimationPlayState): void {
    this.setAttribute('data-animation-state', state)
    this.updateToggleButton(state)
  }

  private updateToggleButton(state: AnimationPlayState): void {
    if (!this.toggleButton) return

    this.toggleButton.setAttribute('aria-pressed', state === 'paused' ? 'true' : 'false')
    this.toggleButton.setAttribute('aria-label', state === 'paused' ? 'Play animation' : 'Pause animation')
    this.toggleButton.dataset['animationState'] = state

    const pauseIcon = queryAnimationTogglePauseIcon(this.toggleButton)
    const playIcon = queryAnimationTogglePlayIcon(this.toggleButton)

    pauseIcon?.classList.toggle('hidden', state === 'paused')
    playIcon?.classList.toggle('hidden', state === 'playing')
  }

  private resetToggleButton(): void {
    if (!this.toggleButton) return

    this.toggleButton.removeAttribute('data-animation-state')
    this.toggleButton.setAttribute('aria-label', 'Pause animation')
    this.toggleButton.setAttribute('aria-pressed', 'false')

    const pauseIcon = queryAnimationTogglePauseIcon(this.toggleButton)
    const playIcon = queryAnimationTogglePlayIcon(this.toggleButton)

    pauseIcon?.classList.remove('hidden')
    playIcon?.classList.add('hidden')

    this.toggleButton = null
  }

  private handleToggleClick(event: Event): void {
    event.preventDefault()

    if (!this.toggleButton) return

    const state = this.getAnimationState()

    if (state === 'playing') {
      if (this.animationController) {
        this.animationController.requestPause()
      } else {
        this.pause()
      }
      return
    }

    if (this.animationController) {
      this.animationController.requestPlay()
      return
    }

    this.resume()
  }

  private getAnimationState(): AnimationPlayState {
    const state = this.getAttribute('data-animation-state') as AnimationPlayState | null
    return state ?? 'playing'
  }

  private getDefaultAnimationState(): AnimationPlayState {
    if (typeof window === 'undefined') {
      return 'playing'
    }

    try {
      if (typeof window.matchMedia === 'function') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        if (mediaQuery.matches) {
          return 'paused'
        }
      }
    } catch {
      // Best effort only; fall through to playing
    }

    return 'playing'
  }

  private startAnimation() {
    if (typeof document === 'undefined') return
    if (document.getElementById('heroAnimation') == undefined) return
    if (this.timeline) return

    const context = { scriptName: SCRIPT_NAME, operation: 'startAnimation' }
    addScriptBreadcrumb(context)

    try {
      gsap.set('.monitorBottom', {
        transformOrigin: '50% 100%',
      })

      gsap.set(['.monitorStand', '.laptopBase', '.tabletScreen'], {
        transformOrigin: '50% 0%',
      })

      gsap.set(
        [
          '.monitorLogo',
          '.monitorScreen',
          '.laptopScreen',
          '.laptopTrackpad',
          '.tabletGroup',
          '.laptopGroup',
          '.tabletButton',
          '.tabletCamera',
          '.tabletContentGroup',
          '.phoneButton',
          '.phoneCamera',
          '.phoneSpeaker',
          '.laptopContentGroup',
          '.phoneGroup',
        ],
        {
          transformOrigin: '50% 50%',
        }
      )

      gsap.set(['.laptopEdgeLeft', '.laptopEdgeRight'], {
        transformOrigin: '0% 100%',
      })

      gsap.set('.tabletGroup', {
        rotation: -90,
      })

      gsap.set('svg', {
        visibility: 'visible',
      })

      this.timeline = gsap
        .timeline({
          defaults: { duration: 1, immediateRender: false },
          delay: 1,
          paused: true,
          repeat: -1,
          yoyo: false,
        })
        .timeScale(3)
        .from('.monitorBottom', {
          scaleY: 0,
          ease: 'power1',
        })
        .from(
          '.monitorStand',
          {
            y: -70,
            ease: 'power1',
          },
          '-=1'
        )
        .from(
          '.monitorStandShadow',
          {
            duration: 0.5,
            alpha: 0,
            ease: 'power1.in',
          },
          '-=0.5'
        )
        .from(
          '.monitorEdge',
          {
            y: 330,
          },
          '-=0.25'
        )
        .from(
          '.monitorScreen',
          {
            duration: 2,
            y: 330,
            ease: 'power1',
          },
          '-=1'
        )
        .from(
          '.monitorContentGroup path',
          {
            duration: 1,
            scaleX: 0,
            stagger: 0.1,
          }
        )
        .from('.monitorLogo', {
          scale: 0,
          ease: 'back(2)',
        })
        .to('.monitorContentGroup path', {
          alpha: 0,
          delay: 2,
          stagger: { each: 0.1 },
        })
        .to(
          '.monitorScreen',
          {
            y: 330,
            ease: 'power1.in',
          },
          '-=1'
        )
        .to(
          '.monitorEdge',
          {
            y: 330,
            ease: 'power1.in',
          },
          '-=0.75'
        )
        .to('.monitorBottom', {
          scaleX: 0.69,
          y: -23,
        })
        .to(
          '.monitorBottom',
          {
            scaleY: 0.45,
            alpha: 1,
          },
          '-=1'
        )
        .set('.monitorBottom', {
          alpha: 0,
        })
        .to(
          '.monitorLogo',
          {
            duration: 0.5,
            scale: 0,
            ease: 'back.in',
          },
          '-=1'
        )
        .to(
          '.monitorStand',
          {
            y: -120,
          },
          '-=1.5'
        )
        .to(
          '.monitorStandShadow',
          {
            duration: 0.5,
            alpha: 0,
          },
          '-=1.5'
        )
        .from(
          '.laptopBase',
          {
            alpha: 0,
          },
          '-=1'
        )
        .from(
          '.laptopTrackpad',
          {
            scaleX: 0,
          },
          '-=1'
        )
        .from('.laptopScreen', {
          scale: 0,
          ease: 'back(0.5)',
        })
        .from(
          '.laptopEdgeLeft',
          {
            duration: 2,
            skewX: -40,
            scaleY: 0,
            ease: 'power3',
          },
          '-=2'
        )
        .from(
          '.laptopEdgeRight',
          {
            duration: 2,
            skewX: 40,
            scaleY: 0,
            ease: 'power3',
          },
          '-=2'
        )
        .from(
          '.laptopContentGroup path',
          {
            duration: 1,
            scaleX: 0,
            stagger: 0.1,
          }
        )
        .to('.laptopTrackpad', {
          duration: 0.3,
          alpha: 0,
          delay: 2,
        })
        .to('.laptopScreen', {
          scaleX: 0.67,
        })
        .to(
          '.laptopScreen',
          {
            scaleY: 0.8,
          },
          '-=1'
        )
        .to(
          '.laptopContentGroup',
          {
            alpha: 0,
            scale: 0.5,
          },
          '-=1'
        )
        .to(
          '.laptopBase',
          {
            y: -20,
            scaleX: 0,
          },
          '-=1'
        )
        .to(
          '.laptopEdgeLeft',
          {
            x: 40,
            transformOrigin: '50% 50%',
            scaleY: 0.85,
          },
          '-=1'
        )
        .to(
          '.laptopEdgeRight',
          {
            x: -40,
            transformOrigin: '50% 50%',
            scaleY: 0.85,
          },
          '-=1'
        )
        .set('.laptopGroup', {
          alpha: 0,
        })
        .from(
          '.tabletGroup',
          {
            scale: 1.1,
            alpha: 0,
          },
          '-=1'
        )
        .to('.tabletGroup', {
          duration: 2,
          rotation: 0,
          delay: 2,
          ease: Anticipate.out,
        })
        .from(
          ['.tabletButton', '.tabletCamera'],
          {
            duration: 0.5,
            scale: 0,
            ease: 'back',
            stagger: 0,
          },
          '-=1'
        )
        .from('.tabletContentGroup', {
          duration: 2,
          rotation: 90,
          scaleX: 1.33,
          scaleY: 0.8,
          ease: 'power3.inOut',
        })
        .to(['.tabletButton', '.tabletCamera'], {
          duration: 0.5,
          scale: 0,
          delay: 2,
        })
        .to('.tabletGroup', {
          scaleX: 0.45,
        })
        .to(
          '.tabletGroup',
          {
            scaleY: 0.7,
          },
          '-=1'
        )
        .to(
          '.tabletContentGroup',
          {
            y: -5,
          },
          '-=1'
        )
        .to(
          '.tabletScreen',
          {
            duration: 0.5,
            scaleY: 0.92,
            y: 4,
          },
          '-=0.5'
        )
        .set('.phoneGroup', {
          alpha: 1,
        })
        .set(['.tabletGroup', '.tabletContentGroup'], {
          alpha: 0,
        })
        .from(
          ['.phoneButton', '.phoneCamera', '.phoneSpeaker'],
          {
            duration: 1,
            scale: 0,
            ease: 'back',
            stagger: 0.1,
          }
        )
        .to('.phoneGroup', {
          duration: 2,
          y: 80,
          delay: 2,
          ease: 'back.in(2)',
        })
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'computers-animation': ComputersAnimationElement
  }
}

export const registerComputersAnimationWebComponent = (tagName: string = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, ComputersAnimationElement)
}

export const webComponentModule: WebComponentModule<ComputersAnimationElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ComputersAnimationElement,
  registerWebComponent: registerComputersAnimationWebComponent,
}
