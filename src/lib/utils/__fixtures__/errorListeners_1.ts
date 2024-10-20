import { addUnhandledRejectionEventListeners } from '../errorListeners'

addUnhandledRejectionEventListeners()

export const test = new Promise((_, reject) => {
  reject(`Test unhandled rejection`)
})
