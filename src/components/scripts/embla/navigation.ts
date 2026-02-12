/**
 * Lightweight Embla navigation-button wiring.
 *
 * Used by components that need prev/next buttons but do NOT need the full
 * autoplay / animation-lifecycle / viewport-observer stack provided by
 * `EmblaCarouselBase` (e.g. ThemePicker).
 */

import type { EmblaCarouselType } from 'embla-carousel'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { handleScriptError } from '@components/scripts/errors/handler'

export interface EmblaNavButtonHandle {
  /** Call after Embla `reInit` or `select` to refresh disabled states. */
  update: () => void
}

/**
 * Bind Embla `select` and `reInit` events to keep prev/next button
 * disabled states in sync. Does **not** bind click handlers — use this
 * when click handlers are managed separately (e.g. ThemePicker, which
 * recreates the Embla instance on every open/close cycle but binds
 * click listeners only once).
 *
 * Returns a handle whose `update()` can be called manually to force a
 * refresh (e.g. after `emblaApi.reInit()`).
 */
export function createEmblaNavStateUpdater(
  emblaApi: EmblaCarouselType,
  prevBtn: HTMLButtonElement,
  nextBtn: HTMLButtonElement
): EmblaNavButtonHandle {
  const updateState = () => {
    if (emblaApi.canScrollPrev()) {
      prevBtn.removeAttribute('disabled')
    } else {
      prevBtn.setAttribute('disabled', 'true')
    }

    if (emblaApi.canScrollNext()) {
      nextBtn.removeAttribute('disabled')
    } else {
      nextBtn.setAttribute('disabled', 'true')
    }
  }

  emblaApi.on('select', updateState)
  emblaApi.on('reInit', updateState)
  updateState()

  return { update: updateState }
}

/**
 * Wire prev/next buttons to an Embla instance with auto-updating
 * disabled states and error-safe click handlers.
 *
 * Returns a handle whose `update()` can be called manually; the function
 * also binds Embla's `select` and `reInit` events automatically.
 *
 * Use `createEmblaNavStateUpdater` instead when click handlers must be
 * bound independently of the Embla instance lifecycle.
 */
export function setupEmblaNavButtons(
  emblaApi: EmblaCarouselType,
  prevBtn: HTMLButtonElement,
  nextBtn: HTMLButtonElement,
  context: { scriptName: string },
  listenerContext?: unknown
): EmblaNavButtonHandle {
  addButtonEventListeners(
    prevBtn,
    () => {
      try {
        emblaApi.scrollPrev()
      } catch (error) {
        handleScriptError(error, { scriptName: context.scriptName, operation: 'scrollPrev' })
      }
    },
    listenerContext
  )

  addButtonEventListeners(
    nextBtn,
    () => {
      try {
        emblaApi.scrollNext()
      } catch (error) {
        handleScriptError(error, { scriptName: context.scriptName, operation: 'scrollNext' })
      }
    },
    listenerContext
  )

  return createEmblaNavStateUpdater(emblaApi, prevBtn, nextBtn)
}
