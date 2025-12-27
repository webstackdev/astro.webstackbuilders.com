export { isClientScriptError, isError, isErrorEvent, isPromiseRejectionEvent } from './assertions'
export { ClientScriptError } from './ClientScriptError'
export { type IClientScriptError, type ClientScriptErrorParams } from './@types/ClientScriptError'
export { addScriptBreadcrumb } from './sentry'

/**
 * !!!! DO NOT RE-EXPORT handleScriptError.ts METHODS FROM THIS FILE !!!!
 *
 * It causes a circular dependency which results in a broken execution order with Rollup.
 */
