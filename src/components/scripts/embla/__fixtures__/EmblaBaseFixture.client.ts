import { EmblaCarouselBase } from '../EmblaCarouselBase'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import type { EmblaCarouselConfig, EmblaElementHandles } from '../types'
import {
  queryEmblaDotsContainer,
  queryEmblaNextButton,
  queryEmblaPrevButton,
  queryEmblaRoot,
  queryEmblaSlides,
  queryEmblaViewport,
} from './selectors'

export class EmblaBaseFixtureElement extends EmblaCarouselBase {
  static registeredName = 'embla-base-fixture'

  protected getConfig(): EmblaCarouselConfig {
    return {
      scriptName: 'EmblaBaseFixture',
      logPrefix: 'embla-fixture',
      animationId: 'embla-base-fixture',
      emblaOptions: { loop: false },
      autoplayOptions: {
        delay: 3000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        playOnInit: false,
      },
    }
  }

  protected queryElements(): EmblaElementHandles {
    const emblaRoot = queryEmblaRoot(this)
    const viewport = queryEmblaViewport(this)
    const dotsContainer = queryEmblaDotsContainer(this)
    const prevBtn = queryEmblaPrevButton(this)
    const nextBtn = queryEmblaNextButton(this)
    const slides = queryEmblaSlides(this)

    if (!emblaRoot || !viewport) {
      throw new Error('Fixture markup missing embla root or viewport')
    }

    return {
      emblaRoot,
      viewport,
      dotsContainer,
      prevBtn,
      nextBtn,
      slideCount: slides.length,
    }
  }
}

export const registerWebComponent = async (
  tagName = EmblaBaseFixtureElement.registeredName
): Promise<void> => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, EmblaBaseFixtureElement)
}

export const webComponentModule: WebComponentModule<EmblaBaseFixtureElement> = {
  registeredName: EmblaBaseFixtureElement.registeredName,
  componentCtor: EmblaBaseFixtureElement,
  registerWebComponent,
}