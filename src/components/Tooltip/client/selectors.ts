import { ClientScriptError } from '@components/scripts/errors'
import { isSpanElement } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  trigger: '[data-tooltip-trigger]',
  tooltip: '[data-tooltip-popup]',
  upgradeCandidates: '[data-tooltip][title]',
  focusableDescendant:
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
} as const

export const getTooltipElements = (root: ParentNode): {
  trigger: HTMLSpanElement
  tooltip: HTMLSpanElement
} => {
  const trigger = root.querySelector(SELECTORS.trigger)
  if (!isSpanElement(trigger)) {
    throw new ClientScriptError({
      message: `Tooltip: trigger element is missing, selector: ${SELECTORS.trigger}`,
    })
  }

  const tooltip = root.querySelector(SELECTORS.tooltip)
  if (!isSpanElement(tooltip)) {
    throw new ClientScriptError({
      message: `Tooltip: popup element is missing, selector: ${SELECTORS.tooltip}`,
    })
  }

  return { trigger, tooltip }
}

export const queryTooltipFocusableDescendant = (root: ParentNode): HTMLElement | null => {
  const element = root.querySelector(SELECTORS.focusableDescendant)
  return element instanceof HTMLElement ? element : null
}

export const queryTooltipInteractiveDescendant = (root: ParentNode): HTMLElement | null => {
  const element = root.querySelector(
    'a[href], button, input, select, textarea, [role="button"], [role="link"]'
  )

  return element instanceof HTMLElement ? element : null
}

export const queryTooltipUpgradeCandidates = (root: ParentNode): HTMLElement[] => {
  return Array.from(root.querySelectorAll(SELECTORS.upgradeCandidates)).filter(
    (element): element is HTMLElement => {
      return element instanceof HTMLElement && !element.closest('site-tooltip')
    }
  )
}