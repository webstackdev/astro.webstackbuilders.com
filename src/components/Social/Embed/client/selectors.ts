import { ClientScriptError } from '@components/scripts/errors'
import { isType1Element } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  unmanagedEmbed: '[data-embed]:not([data-embed-managed])',
  placeholder: '[data-embed-placeholder]',
  loadingStatus: '[data-embed-loading-status]',
  iframe: 'iframe',
  script: 'script',
  video: 'video',
} as const

/**
 * Returns all embed elements that have not yet been managed.
 */
export const queryUnmanagedEmbedElements = (root: ParentNode = document): HTMLElement[] => {
  return Array.from(root.querySelectorAll(SELECTORS.unmanagedEmbed)).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  )
}

/**
 * Optional placeholder node inserted by `social-embed` while loading.
 */
export const queryEmbedPlaceholder = (root: ParentNode): HTMLElement | null => {
  const placeholder = root.querySelector(SELECTORS.placeholder)
  return placeholder instanceof HTMLElement ? placeholder : null
}

/**
 * Optional status node inserted by `social-embed` while loading.
 */
export const queryEmbedLoadingStatus = (root: ParentNode): HTMLElement | null => {
  const status = root.querySelector(SELECTORS.loadingStatus)
  return status instanceof HTMLElement ? status : null
}

export const removeEmbedLoadingStatusNode = (root: ParentNode): void => {
  const status = queryEmbedLoadingStatus(root)
  status?.remove()
}

export const queryIframes = (root: ParentNode): HTMLIFrameElement[] => {
  return Array.from(root.querySelectorAll(SELECTORS.iframe)).filter(
    (node): node is HTMLIFrameElement => isType1Element(node) && node.tagName === 'IFRAME',
  ) as HTMLIFrameElement[]
}

export const queryFirstIframe = (root: ParentNode): HTMLIFrameElement | null => {
  const iframe = root.querySelector(SELECTORS.iframe)
  return isType1Element(iframe) && iframe.tagName === 'IFRAME' ? (iframe as HTMLIFrameElement) : null
}

export const queryVideos = (root: ParentNode): HTMLVideoElement[] => {
  return Array.from(root.querySelectorAll(SELECTORS.video)).filter(
    (node): node is HTMLVideoElement => isType1Element(node) && node.tagName === 'VIDEO',
  ) as HTMLVideoElement[]
}

export const queryScripts = (root: ParentNode): HTMLScriptElement[] => {
  return Array.from(root.querySelectorAll(SELECTORS.script)).filter(
    (node): node is HTMLScriptElement => isType1Element(node) && node.tagName === 'SCRIPT',
  ) as HTMLScriptElement[]
}

export const assertHasEmbedPlaceholder = (root: ParentNode): HTMLElement => {
  const placeholder = queryEmbedPlaceholder(root)
  if (!placeholder) {
    throw new ClientScriptError({
      scriptName: 'EmbedInstance',
      operation: 'assertHasEmbedPlaceholder',
      message: 'Placeholder not found in embed container',
    })
  }

  return placeholder
}
