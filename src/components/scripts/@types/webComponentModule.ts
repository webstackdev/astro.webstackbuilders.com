export interface WebComponentModule<TElement extends HTMLElement = HTMLElement> {
  registeredName: string
  componentCtor: CustomElementConstructor & { prototype: TElement }
  registerWebComponent: (_tagName?: string) => Promise<void> | void
}
