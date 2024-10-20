/**
 * Shared Jest configuration set up with TypeScript for all environments. When using
 * TypeScript Jest config files, Jest will use `ts-node` to compile the config file.
 * `ts-jest` doesn't take part in that process.
 */

import * as dotenv from 'dotenv'
import type { Config } from '@jest/types'

export type ConfigOptions = Config.InitialOptions

// load environmental variables if not already loaded
if (!process.env['ELEVENTY_ENV_VARS_INIT']) {
  dotenv.config({ path: './.env.local' })
}

const config: ConfigOptions = {
  /** Directory where Jest should output coverage files */
  //coverageDirectory: `<rootDir>/coverage`,
  /** Force Jest globals e.g. expect, describe, etc. to be imported from @jest/globals */
  // injectGlobals: false,
  /** Activates native OS notifications for test results, requires `node-notifier` package */
  //notify: true,
  /**
   * @TODO: Move roots from the JSDOM and NODE config files to here, and differentiate
   *        on filename e.g. `mytest.jsdom.ts` and `mytest.node.ts` instead of `mytest.spec.ts`
   */
  // roots: []
  /** Ignore any tests in the node_modules, .cache, or public directories */
  testPathIgnorePatterns: [`node_modules`, `<rootDir>/public`],
  /** Set up for Babel config for TypeScript code */
  transform: {
    '.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.jest.json',
      },
    ],
    //require.resolve(`ts-jest`), // getting errors with canvas not compiling correctly
  },
  //verbose: true, // getting errors with canvas not compiling correctly
}

export default config

/*
@TODO: (if useful, top level config key) A map from regular expressions to module names or to arrays of module names that allow to stub out resources, like images or styles with a single module. You can substitute captured regex groups using numbered backreferences.

  moduleNameMapper: {
    '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
    '^[./a-zA-Z0-9$_-]+\\.png$': '<rootDir>/RelativeImageStub.js',
    'module_name_(.*)': '<rootDir>/substituted_module_$1.js',
    'assets/(.*)': [
      '<rootDir>/images/$1',
      '<rootDir>/photos/$1',
      '<rootDir>/recipes/$1',
    ],
  },
*/
