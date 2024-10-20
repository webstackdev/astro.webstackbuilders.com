import { addUnhandledRejectionEventListeners } from '../errorListeners'

addUnhandledRejectionEventListeners()

export const test = new Promise((_, reject) => {
  reject(new Error(`Test new error object in unhandled rejection`))
})
