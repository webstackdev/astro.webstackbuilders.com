const { Console } = console
import type { EnvironmentContext } from '@jest/environment'
import { PassThrough } from 'stream'

/**
 *
 * @example pragma param is: ['{"JSDOM_QUIET_MODE": false}', '{"something_else": false}']
 */
export const getEnvironmentContext = (pragma?: string | string[]) => {
  /* eslint-disable-next-line no-null/no-null */
  const options = Object.create(null)
  if (pragma) {
    options['jest-environment-options'] = pragma
  }
  const context: EnvironmentContext = {
    console: new Console(new PassThrough()),
    docblockPragmas: options,
    testPath: process.cwd(),
  }
  return context
}

