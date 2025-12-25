export const defineCustomElement = (tagName: string, elementClass: CustomElementConstructor): void => {
  if (typeof customElements === 'undefined') {
    return
  }

  try {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, elementClass)
    }
  } catch {
    // Best effort only; if custom element registration fails, consumers can continue without JS enhancements.
  }
}
