import type { LitElement } from 'lit'

export interface WebComponentModule<TElement extends HTMLElement = LitElement> {
  registeredName: string
  componentCtor: CustomElementConstructor & { prototype: TElement }
  registerWebComponent: (_tagName?: string) => Promise<void> | void
}
