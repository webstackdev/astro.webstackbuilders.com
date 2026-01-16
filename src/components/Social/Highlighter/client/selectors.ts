import {
  isButtonElement,
  isDivElement,
  isSpanElement,
  isType1Element,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  wrapper: '.highlighter__wrapper',
  trigger: '.highlighter__trigger',
  dialog: '.share-dialog',
  dialogArrow: '.share-dialog__arrow',
  shareButton: '.share-button',
  shareIcon: 'svg.share-icon',
  xIconTilePath: '.xTile',
  xIconGlyphPath: '.xGlyph',
  status: '[data-highlighter-status]',
} as const

export const queryHighlighterWrapper = (context: Element): HTMLDivElement | null => {
  const wrapper = context.querySelector(SELECTORS.wrapper)
  return isDivElement(wrapper) ? wrapper : null
}

export const queryHighlighterTrigger = (context: Element): HTMLButtonElement | null => {
  const trigger = context.querySelector(SELECTORS.trigger)
  return isButtonElement(trigger) ? trigger : null
}

export const queryShareDialog = (context: Element): HTMLDivElement | null => {
  const dialog = context.querySelector(SELECTORS.dialog)
  return isDivElement(dialog) ? dialog : null
}

export const queryShareButtons = (context: Element): HTMLButtonElement[] => {
  return Array.from(context.querySelectorAll(SELECTORS.shareButton)).filter(
    (node): node is HTMLButtonElement => isButtonElement(node)
  )
}

export const queryShareDialogArrow = (context: Element): HTMLDivElement | null => {
  const arrow = context.querySelector(SELECTORS.dialogArrow)
  return isDivElement(arrow) ? arrow : null
}

export const queryShareIcon = (context: Element): SVGSVGElement | null => {
  const icon = context.querySelector(SELECTORS.shareIcon)
  return icon instanceof SVGSVGElement ? icon : null
}

export const queryXIconTilePath = (context: Element): SVGPathElement | null => {
  const path = context.querySelector(SELECTORS.xIconTilePath)
  if (!path) {
    return null
  }

  const isSvgPath =
    path instanceof Element &&
    path.namespaceURI === 'http://www.w3.org/2000/svg' &&
    path.tagName.toLowerCase() === 'path'

  return isSvgPath ? (path as unknown as SVGPathElement) : null
}

export const queryXIconGlyphPaths = (context: Element): SVGPathElement[] => {
  return Array.from(context.querySelectorAll(SELECTORS.xIconGlyphPath)).filter(
    (node): node is SVGPathElement =>
      node instanceof Element &&
      node.namespaceURI === 'http://www.w3.org/2000/svg' &&
      node.tagName.toLowerCase() === 'path'
  )
}

export const queryHighlighterStatus = (context: Element): HTMLSpanElement | null => {
  const status = context.querySelector(SELECTORS.status)
  return isSpanElement(status) ? status : null
}

export const queryElementById = (context: Element, id: string): Element | null => {
  const safeId = id.replaceAll('"', '\\"')
  const element = context.querySelector(`[id="${safeId}"]`)
  return isType1Element(element) ? element : null
}

export const getHighlighterRenderElements = (context: Element) => {
  const wrapper = queryHighlighterWrapper(context)
  if (!wrapper) {
    throw new ClientScriptError({
      scriptName: 'HighlighterElement',
      operation: 'getHighlighterRenderElements',
      message: 'Highlighter wrapper element not found',
    })
  }

  const trigger = queryHighlighterTrigger(context)
  if (!trigger) {
    throw new ClientScriptError({
      scriptName: 'HighlighterElement',
      operation: 'getHighlighterRenderElements',
      message: 'Highlighter trigger button not found',
    })
  }

  const dialog = queryShareDialog(context)
  if (!dialog) {
    throw new ClientScriptError({
      scriptName: 'HighlighterElement',
      operation: 'getHighlighterRenderElements',
      message: 'Highlighter share dialog not found',
    })
  }

  const status = queryHighlighterStatus(context)
  if (!status) {
    throw new ClientScriptError({
      scriptName: 'HighlighterElement',
      operation: 'getHighlighterRenderElements',
      message: 'Highlighter status element not found',
    })
  }

  const shareButtons = queryShareButtons(context)
  if (shareButtons.length === 0) {
    throw new ClientScriptError({
      scriptName: 'HighlighterElement',
      operation: 'getHighlighterRenderElements',
      message: 'Highlighter share buttons not found',
    })
  }

  return {
    wrapper,
    trigger,
    dialog,
    status,
    shareButtons,
  }
}
