import { addUnhandledExceptionEventListeners } from '../errorListeners'

addUnhandledExceptionEventListeners()

throw new Error(`Test unhandled exception`)
