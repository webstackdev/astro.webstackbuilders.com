import type { LitElement } from 'lit'

export interface WebComponentModule<TElement extends LitElement = LitElement> {
  registeredName: string
  componentCtor: CustomElementConstructor & { prototype: TElement }
  registerWebComponent: (tagName?: string) => Promise<void> | void
}
