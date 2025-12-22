export function registerCodeBlockWebComponent(): void {
  if (customElements.get('code-block')) return
  customElements.define('code-block', CodeBlockElement)
}

class CodeBlockElement extends HTMLElement {
  connectedCallback(): void {
    if (this.dataset['enhanced'] === 'true') return
    this.dataset['enhanced'] = 'true'
  }
}
