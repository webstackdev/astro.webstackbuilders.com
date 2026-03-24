import type { HTMLElement as NHPElement } from 'node-html-parser'

export const queryListItemElements = (context: NHPElement): NHPElement[] => {
  return context.querySelectorAll('wsb-list-item')
}