import { handleScriptError } from '@components/scripts/errors/handler'
import { addWrapperEventListeners } from '@components/scripts/elementListeners'
import { defineCustomElement } from '@components/scripts/utils'
import { createE2ELogger, EmblaCarouselBase } from '@components/scripts/embla'
import type { EmblaCarouselConfig, EmblaElementHandles } from '@components/scripts/embla'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getCarouselEmblaRoot,
  getCarouselViewport,
  hasCarouselFocusVisibleSlide,
  queryCarouselDotsContainer,
  queryCarouselNextBtn,
  queryCarouselPrevBtn,
  queryCarouselSlides,
  queryCarouselStatusRegion,
} from './selectors'

const SCRIPT_NAME = 'CarouselElement'
const logForE2E = createE2ELogger('carousel')

export class CarouselElement extends EmblaCarouselBase {
  private statusRegion: HTMLElement | null = null
  private readonly keyupHandler = (event: Event) => this.handleKeyup(event)

  // ────────────────────── Base class abstract implementations ──────────────────────

  protected getConfig(): EmblaCarouselConfig {
    return {
      emblaOptions: {
        loop: true,
        align: 'start',
        skipSnaps: false,
        dragFree: false,
      },
      autoplayOptions: {
        delay: 4000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        playOnInit: false,
      },
      animationId: 'carousel',
      scriptName: SCRIPT_NAME,
      logPrefix: 'carousel',
    }
  }

  protected queryElements(): EmblaElementHandles {
    return {
      emblaRoot: getCarouselEmblaRoot(this),
      viewport: getCarouselViewport(this),
      slideCount: queryCarouselSlides(this).length,
      dotsContainer: queryCarouselDotsContainer(this),
      prevBtn: queryCarouselPrevBtn(this),
      nextBtn: queryCarouselNextBtn(this),
    }
  }

  protected override hasFocusVisibleSlide(): boolean {
    return hasCarouselFocusVisibleSlide(this)
  }

  protected override isFocusInsideSlide(target: HTMLElement): boolean {
    return target.closest('[data-carousel-slide]') !== null
  }

  // ────────────────────── Carousel-specific behaviour ──────────────────────

  protected override onInitialized(): void {
    this.statusRegion = queryCarouselStatusRegion(this)
    this.setupStatusRegion()
    if (!this.dataset['carouselKeyListener']) {
      addWrapperEventListeners(this, this.keyupHandler, this, {
        allowedKeys: ['ArrowLeft', 'ArrowRight'],
      })
      this.dataset['carouselKeyListener'] = 'true'
    }
  }

  private handleKeyup(event: Event): void {
    if (!this.emblaApi) return
    if (!(typeof (event as KeyboardEvent).key === 'string')) return

    const keyboardEvent = event as KeyboardEvent

    if (keyboardEvent.defaultPrevented) return
    if (keyboardEvent.metaKey || keyboardEvent.ctrlKey || keyboardEvent.altKey) return

    const key = keyboardEvent.key
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return

    const target = keyboardEvent.target
    if (target instanceof HTMLElement) {
      const tag = target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable)
        return
    }

    try {
      if (key === 'ArrowLeft') {
        this.emblaApi.scrollPrev()
      } else {
        this.emblaApi.scrollNext()
      }
      keyboardEvent.preventDefault()
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'handleKeyup' })
    }
  }

  private setupStatusRegion(): void {
    if (!this.emblaApi || !this.statusRegion) return

    const updateStatus = () => {
      if (!this.emblaApi || !this.statusRegion) return

      const total = this.emblaApi.scrollSnapList().length
      const current = this.emblaApi.selectedScrollSnap() + 1
      this.statusRegion.textContent = `Slide ${current} of ${total}`
    }

    updateStatus()
    this.emblaApi.on('select', updateStatus)
    this.emblaApi.on('reInit', updateStatus)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'carousel-slider': CarouselElement
  }
}

export const registerCarouselWebComponent = (tagName = 'carousel-slider') => {
  if (typeof window === 'undefined') return
  logForE2E('info', 'register:invoke', { tagName })
  defineCustomElement(tagName, CarouselElement)
}

export const webComponentModule: WebComponentModule<CarouselElement> = {
  registeredName: 'carousel-slider',
  componentCtor: CarouselElement,
  registerWebComponent: registerCarouselWebComponent,
}
