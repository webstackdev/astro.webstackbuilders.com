import { handleScriptError } from '@components/scripts/errors/handler'
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
  private readonly keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event)

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
    this.addEventListener('keydown', this.keydownHandler)
  }

  protected override onTeardown(): void {
    this.removeEventListener('keydown', this.keydownHandler)
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.emblaApi) return
    if (event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.altKey) return

    const key = event.key
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return

    const target = event.target
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
      event.preventDefault()
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'handleKeydown' })
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
