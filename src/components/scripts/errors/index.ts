export {
  isClientScriptError,
  isError,
  isErrorEvent,
  isPromiseRejectionEvent,
} from './assertions'
export { handleScriptError } from './handler'
export { ClientScriptError } from './ClientScriptError'
export { type IClientScriptError, type ClientScriptErrorParams } from './@types/ClientScriptError'
export { addScriptBreadcrumb } from './sentry'
