import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'

export const copyFromElement = async (button: HTMLElement): Promise<string | null> => {
  const id = button.getAttribute('for')
  const text = button.getAttribute('value')

  if (button.getAttribute('aria-disabled') === 'true') {
    return null
  }

  if (typeof text === 'string' && text.length > 0) {
    await copyText(text)
    return text
  }

  if (typeof id !== 'string' || id.length === 0) {
    return null
  }

  const ownerDocument = button.ownerDocument
  const root = typeof button.getRootNode === 'function' ? button.getRootNode() : ownerDocument

  const rootWindow = ownerDocument.defaultView
  const shadowRootCtor = rootWindow?.ShadowRoot
  const isShadowRoot = Boolean(shadowRootCtor) && root instanceof (shadowRootCtor as unknown as typeof ShadowRoot)
  const isOwnerDocument = root === ownerDocument

  const nodeFromRoot = isOwnerDocument
    ? ownerDocument.getElementById(id)
    : isShadowRoot
      ? (root as ShadowRoot).getElementById?.(id) ?? (root as ShadowRoot).querySelector(`#${id}`)
      : null

  const node = nodeFromRoot ?? ownerDocument.getElementById(id)
  if (!node) {
    return null
  }

  const copiedText = getCopyTextFromTarget(node)
  await copyText(copiedText)
  return copiedText
}

export const getCopyTextFromTarget = (content: Element): string => {
  if (content instanceof HTMLInputElement || content instanceof HTMLTextAreaElement) {
    return content.value
  }

  if (content instanceof HTMLAnchorElement && content.hasAttribute('href')) {
    return content.href
  }

  return content.textContent || ''
}

export function copyText(text: string): Promise<void> {
  const clipboard = getClipboard()
  if (clipboard) {
    return clipboard.writeText(text)
  }

  return Promise.reject(new ClientScriptError('CopyToClipboard: Clipboard API is unavailable'))
}

const getClipboard = (): Navigator['clipboard'] | null => {
  const nav = typeof window !== 'undefined' ? window.navigator : typeof navigator !== 'undefined' ? navigator : undefined
  if (!nav || !('clipboard' in nav)) {
    return null
  }

  const clipboard = nav.clipboard
  if (!clipboard?.writeText) {
    return null
  }

  return clipboard
}
