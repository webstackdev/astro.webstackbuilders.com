import { isAnchorElement, isType1Element } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

const HOST_TAG_NAME = 'DOWNLOAD-CTA'

export const SELECTORS = {
  host: 'download-cta',
  primaryLink: '[data-download-cta-primary]',
} as const

type SelectorRoot = Document | DocumentFragment | Element

const resolveRoot = (root?: SelectorRoot): SelectorRoot => {
  return root ?? document
}

const isDownloadCtaHost = (element: unknown): element is HTMLElement => {
  return isType1Element(element) && element.tagName === HOST_TAG_NAME
}

export const getDownloadCtaHost = (root?: SelectorRoot): HTMLElement => {
  const resolvedRoot = resolveRoot(root)
  const host = isDownloadCtaHost(resolvedRoot)
    ? resolvedRoot
    : resolvedRoot.querySelector(SELECTORS.host)

  if (!isDownloadCtaHost(host)) {
    throw new ClientScriptError({
      message: 'Download CTA host element not found',
    })
  }

  return host
}

export const getDownloadCtaPrimaryLink = (root?: SelectorRoot): HTMLAnchorElement => {
  const primaryLink = getDownloadCtaHost(root).querySelector(SELECTORS.primaryLink)

  if (!isAnchorElement(primaryLink)) {
    throw new ClientScriptError({
      message: 'Download CTA primary link not found',
    })
  }

  return primaryLink
}

export const getDownloadCtaUrls = (root?: SelectorRoot): {
  landingUrl: string
  directDownloadUrl: string
} => {
  const host = getDownloadCtaHost(root)
  const landingUrl = host.dataset['landingUrl']?.trim() ?? ''
  const directDownloadUrl = host.dataset['directDownloadUrl']?.trim() ?? ''

  if (!landingUrl || !directDownloadUrl) {
    throw new ClientScriptError({
      message: 'Download CTA URLs are missing required data attributes',
    })
  }

  return {
    landingUrl,
    directDownloadUrl,
  }
}