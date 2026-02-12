import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { isType1Element } from '@components/scripts/assertions/elements'
import { defineCustomElement } from '@components/scripts/utils'
import { createE2ELogger, EmblaCarouselBase } from '@components/scripts/embla'
import type { EmblaCarouselConfig, EmblaElementHandles } from '@components/scripts/embla'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getSkillsEmblaRoot,
  getSkillsViewport,
  querySkillsAutoplayPauseIcon,
  querySkillsAutoplayPlayIcon,
  querySkillsAutoplayToggle,
  querySkillsNextBtn,
  querySkillsPrevBtn,
  querySkillsSlides,
} from './selectors'

const SCRIPT_NAME = 'SkillsCarouselElement'
const logForE2E = createE2ELogger('skills')

export class SkillsCarouselElement extends EmblaCarouselBase {
  private autoplayToggleBtn: HTMLButtonElement | null = null

  protected getConfig(): EmblaCarouselConfig {
    return {
      emblaOptions: {
        loop: true,
        align: 'start',
        skipSnaps: false,
        dragFree: false,
      },
      autoplayOptions: {
        delay: 5000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        playOnInit: false,
      },
      animationId: 'skills-carousel',
      scriptName: SCRIPT_NAME,
      logPrefix: 'skills',
    }
  }

  protected queryElements(): EmblaElementHandles {
    return {
      emblaRoot: getSkillsEmblaRoot(this),
      viewport: getSkillsViewport(this),
      slideCount: querySkillsSlides(this).length,
      prevBtn: querySkillsPrevBtn(this),
      nextBtn: querySkillsNextBtn(this),
    }
  }

  protected override onInitialized(): void {
    this.autoplayToggleBtn = querySkillsAutoplayToggle(this)
    this.setupAutoplayToggle()
    if (this.hasAutoplaySupport) {
      this.resume()
    }
  }

  protected override onTeardown(): void {
    this.autoplayToggleBtn = null
  }

  protected override onAutoplayStateChange(state: 'playing' | 'paused'): void {
    this.syncAutoplayToggleButton(state)
  }

  private setupAutoplayToggle(): void {
    if (!this.autoplayToggleBtn) return

    const viewportId = this.viewport?.getAttribute('id')
    if (viewportId) {
      this.autoplayToggleBtn.setAttribute('aria-controls', viewportId)
    }

    addButtonEventListeners(
      this.autoplayToggleBtn,
      () => {
        const state = this.getAttribute('data-carousel-autoplay')
        if (state === 'playing') {
          this.pause()
          return
        }
        this.resume()
      },
      this
    )

    const initialState =
      (this.getAttribute('data-carousel-autoplay') as 'playing' | 'paused' | null) ?? 'paused'
    this.syncAutoplayToggleButton(initialState)
  }

  private syncAutoplayToggleButton(state: 'playing' | 'paused'): void {
    if (!this.autoplayToggleBtn) return

    const pauseIcon = querySkillsAutoplayPauseIcon(this.autoplayToggleBtn)
    const playIcon = querySkillsAutoplayPlayIcon(this.autoplayToggleBtn)

    if (state === 'playing') {
      this.autoplayToggleBtn.setAttribute('aria-label', 'Pause skills')
      this.autoplayToggleBtn.setAttribute('aria-pressed', 'false')
      if (isType1Element(pauseIcon)) pauseIcon.classList.remove('hidden')
      if (isType1Element(playIcon)) playIcon.classList.add('hidden')
      return
    }

    this.autoplayToggleBtn.setAttribute('aria-label', 'Play skills')
    this.autoplayToggleBtn.setAttribute('aria-pressed', 'true')
    if (isType1Element(pauseIcon)) pauseIcon.classList.add('hidden')
    if (isType1Element(playIcon)) playIcon.classList.remove('hidden')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'skills-carousel': SkillsCarouselElement
  }
}

export const registerSkillsCarouselWebComponent = (tagName = 'skills-carousel') => {
  if (typeof window === 'undefined') return
  logForE2E('info', 'register:invoke', { tagName })
  defineCustomElement(tagName, SkillsCarouselElement)
}

export const webComponentModule: WebComponentModule<SkillsCarouselElement> = {
  registeredName: 'skills-carousel',
  componentCtor: SkillsCarouselElement,
  registerWebComponent: registerSkillsCarouselWebComponent,
}