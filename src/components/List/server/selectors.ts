import { isType1Element } from '@components/scripts/assertions/elements'

export const queryListItemElements = (context: ParentNode): Element[] => {
  return Array.from(context.querySelectorAll('wsb-list-item')).filter((element): element is Element => {
    return isType1Element(element) && element.tagName.toLowerCase() === 'wsb-list-item'
  })
}