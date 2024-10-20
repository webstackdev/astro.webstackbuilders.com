import { addWrapperEventListeners } from '../elementListeners'

function handler() {
  document.querySelector(`body`)!.innerHTML = `SUCCESS`
}

const wrapper = document.querySelector(`div`)!
addWrapperEventListeners(wrapper, handler)
