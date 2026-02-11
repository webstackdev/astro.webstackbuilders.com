/**
 * Shared Embla carousel utilities - Barrel Export
 */
export { EmblaCarouselBase } from './EmblaCarouselBase'
export { createE2ELogger } from './logging'
export {
  createEmblaNavStateUpdater,
  setupEmblaNavButtons,
  type EmblaNavButtonHandle,
} from './navigation'
export type {
  AutoplayOptions,
  EmblaCarouselConfig,
  EmblaElementHandles,
  EmblaRootElement,
  TimerHandle,
} from './types'
