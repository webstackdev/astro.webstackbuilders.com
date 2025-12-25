import { isDivElement, isMetaElement, isSpanElement, isType1Element } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  container: '.social-share',
  label: '.social-share__label',
  shareItem: '[data-share]',
  metaDescription: 'meta[name="description"]',
} as const

export function getSocialShareRenderElements(context: Element) {
  const container = context.querySelector(SELECTORS.container)
  if (!isDivElement(container)) {
    throw new ClientScriptError({
      scriptName: 'SocialShareElement',
      operation: 'getSocialShareRenderElements',
      message: 'Social share container element not found',
    })
  }

  const label = context.querySelector(SELECTORS.label)
  if (!isSpanElement(label)) {
    throw new ClientScriptError({
      scriptName: 'SocialShareElement',
      operation: 'getSocialShareRenderElements',
      message: 'Social share label element not found',
    })
  }

  const shareItems = Array.from(context.querySelectorAll(SELECTORS.shareItem)).filter(
    (node): node is HTMLAnchorElement | HTMLButtonElement =>
      isType1Element(node) && (node instanceof HTMLAnchorElement || node instanceof HTMLButtonElement),
  )

  if (shareItems.length === 0) {
    throw new ClientScriptError({
      scriptName: 'SocialShareElement',
      operation: 'getSocialShareRenderElements',
      message: 'Social share items not found',
    })
  }

  return {
    container,
    label,
    shareItems,
  }
}

/**
 * Optional meta description tag that lives outside the web component.
 * Returns null when not present.
 */
export function queryMetaDescription(root: ParentNode = document): HTMLMetaElement | null {
  const candidate = root.querySelector(SELECTORS.metaDescription)
  if (!candidate) {
    return null
  }

  if (!isMetaElement(candidate)) {
    return null
  }

  return candidate
}
