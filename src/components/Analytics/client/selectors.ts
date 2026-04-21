import { isType1Element } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  analyticsState: 'vercel-analytics-state:last-of-type',
} as const

export const queryAnalyticsStateElement = (root: ParentNode = document): HTMLElement | null => {
  const element = root.querySelector(SELECTORS.analyticsState)
  return isType1Element(element) && element instanceof HTMLElement ? element : null
}
