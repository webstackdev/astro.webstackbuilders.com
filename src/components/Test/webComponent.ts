import { LitElement, html, css } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

export class TestWebComponent extends LitElement {
  static registeredName = 'test-web-component'

  static override properties = {
    message: { type: String },
  }

  static override styles = css`
    :host {
      display: block;
      border: 1px dashed var(--color-border, #888);
      padding: 0.5rem;
    }
  `

  protected override createRenderRoot() {
    // Renders into the light DOM
    return this
  }

  declare message: string

  constructor() {
    super()
    this.message = 'Hello from Lit'
  }

  protected override render() {
    return html`<span id="message">${this.message}</span>`
  }
}

export const registerWebComponent = async (tagName = TestWebComponent.registeredName) => {
  defineCustomElement(tagName, TestWebComponent)
}

export const webComponentModule: WebComponentModule<TestWebComponent> = {
  registeredName: TestWebComponent.registeredName,
  componentCtor: TestWebComponent,
  registerWebComponent,
}
