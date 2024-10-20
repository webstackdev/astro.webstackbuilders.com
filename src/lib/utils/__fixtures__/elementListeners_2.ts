import { addLinkEventListeners } from '../elementListeners'

function handler() {
  document.querySelector(`body`)!.innerHTML = `SUCCESS`
}

const anchor = document.querySelector(`a`)!
addLinkEventListeners(anchor, handler)
