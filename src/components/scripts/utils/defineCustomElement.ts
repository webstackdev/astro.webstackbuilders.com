export const defineCustomElement = (tagName: string, elementClass: CustomElementConstructor): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass)
  }
}
