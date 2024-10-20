/**
 * Usage of JSDOM quiet flag, include the following in a JSDOC block:
 *
 * @jest-environment-options {"JSDOM_QUIET_MODE": true}
 */
export { getJsdomQuietModeFlag } from './utility'
export { setQuietMode, unsetQuietMode } from './setters'
