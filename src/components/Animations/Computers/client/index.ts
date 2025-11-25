import { LitElement } from 'lit'
import { gsap } from 'gsap'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { AnimationLifecycleEvent, onAnimationEvent } from '@components/scripts/events'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

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
  private overlayOpenedCleanup: (() => void) | undefined
  private overlayClosedCleanup: (() => void) | undefined
  private initialized = false
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
      this.startAnimation()
      this.overlayOpenedCleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, () => {
        this.pause()
      })
      this.overlayClosedCleanup = onAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, () => {
        this.resume()
      })
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
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  resume(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'resume' }
    addScriptBreadcrumb(context)

    try {
      this.timeline?.play()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private teardown(): void {
    if (!this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'teardown' }
    addScriptBreadcrumb(context)

    try {
      this.overlayOpenedCleanup?.()
      this.overlayClosedCleanup?.()
      this.overlayOpenedCleanup = undefined
      this.overlayClosedCleanup = undefined

      if (this.timeline) {
        this.timeline.kill()
        this.timeline = null
      }

      this.initialized = false
    } catch (error) {
      handleScriptError(error, context)
    }
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
          defaults: { duration: 1 },
          delay: 1,
          paused: false,
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
