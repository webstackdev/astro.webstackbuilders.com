import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

export class CodeBlockElement extends LitElement {
  static registeredName = 'code-block'

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()

    if (this.dataset['enhanced'] === 'true') return
    this.dataset['enhanced'] = 'true'
  }
}

export const registerWebComponent = async (
  tagName = CodeBlockElement.registeredName
): Promise<void> => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, CodeBlockElement)
}

export const registerCodeBlockWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<CodeBlockElement> = {
  registeredName: CodeBlockElement.registeredName,
  componentCtor: CodeBlockElement,
  registerWebComponent,
}
