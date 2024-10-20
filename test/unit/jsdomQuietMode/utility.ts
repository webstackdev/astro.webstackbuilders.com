import type { EnvironmentContext } from '@jest/environment'

/**
 * Extracts the JSDOM_QUIET_MODE pragma setting useable in test files to quiet
 * verbose output from JSDOM console. Useful in Jest custom environments.
 */
export const getJsdomQuietModeFlag = (context: EnvironmentContext): boolean => {
  const environmentOptions = context.docblockPragmas[`jest-environment-options`]

  let EnvOptionsObj: Record<string, string> & { JSDOM_QUIET_MODE?: boolean } = {}
  if (Array.isArray(environmentOptions)) {
    for (let i = 0; i < environmentOptions.length; i++) {
      const envOption = environmentOptions[i]
      if (envOption) Object.assign(EnvOptionsObj, JSON.parse(envOption))
    }
  } else if (typeof environmentOptions === 'string') {
    EnvOptionsObj = JSON.parse(environmentOptions)
  }

  const hasFlag = Object.prototype.hasOwnProperty.call(EnvOptionsObj, 'JSDOM_QUIET_MODE')
  if (hasFlag) {
    return Boolean(EnvOptionsObj[`JSDOM_QUIET_MODE`])
  }
  return false
}
