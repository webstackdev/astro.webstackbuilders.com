import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'

/** An HTML element augmented with a debug reference to its Embla API instance. */
export type EmblaRootElement = HTMLElement & { __emblaApi__?: EmblaCarouselType }

/** Mirrors `setTimeout` / `window.setTimeout` return type for timer handles. */
export type TimerHandle = ReturnType<typeof setTimeout> | number

/** Autoplay plugin configuration passed to `embla-carousel-autoplay`. */
export interface AutoplayOptions {
  delay: number
  stopOnInteraction: boolean
  stopOnMouseEnter: boolean
  playOnInit: boolean
}

/**
 * Configuration that each concrete carousel subclass must provide to
 * `EmblaCarouselBase` so the base class can wire up Embla and optional
 * autoplay / animation lifecycle features.
 */
export interface EmblaCarouselConfig {
  /** Embla options (loop, align, etc.). */
  emblaOptions: EmblaOptionsType
  /**
   * Autoplay options or `null` to disable autoplay entirely.
   * When `null`, no autoplay plugin is loaded and the animation lifecycle
   * / viewport observer / focus-pause subsystems are skipped.
   */
  autoplayOptions: AutoplayOptions | null
  /** Unique animation ID for the animation-lifecycle store (e.g. `'carousel'`). */
  animationId: string
  /** Script name used in error breadcrumbs (e.g. `'CarouselElement'`). */
  scriptName: string
  /** Short prefix for E2E console logs (e.g. `'carousel'`). */
  logPrefix: string
}

/**
 * The DOM handles a subclass must query and return from `queryElements()`.
 * Only `emblaRoot`, `viewport`, and `slideCount` are required; everything
 * else is optional and will gracefully degrade when absent.
 */
export interface EmblaElementHandles {
  emblaRoot: EmblaRootElement
  viewport: HTMLElement
  /** Total number of slide elements — used to determine autoplay eligibility. */
  slideCount: number
  dotsContainer?: HTMLElement | null
  prevBtn?: HTMLButtonElement | null
  nextBtn?: HTMLButtonElement | null
}
