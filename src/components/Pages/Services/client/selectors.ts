type SelectorRoot = ParentNode

const resolveRoot = (root?: SelectorRoot): SelectorRoot => {
  return root ?? document
}

export const queryServiceContactLinks = (root?: SelectorRoot): HTMLAnchorElement[] => {
  return Array.from(resolveRoot(root).querySelectorAll('[data-service-contact-link]')).filter(
    (element): element is HTMLAnchorElement => element instanceof HTMLAnchorElement
  )
}
