/**
 * Jest configuration for Node environment, set up with TypeScript
 */
import commonJestConfig from './jest.config.common'
import { cacheDir } from '../../scripts/build/paths'
import type { ConfigOptions } from './jest.config.common'

const config: ConfigOptions = {
  /** Add shared configuration options */
  // @TODO: could also be done as a preset, uses <rootDir>. Not sure if it will compile TS.
  // preset: './jest.config.common',
  ...commonJestConfig,

  cacheDirectory: `<rootDir>/${cacheDir}/jest-node`,

  displayName: {
    name: 'NODE',
    color: 'blue',
  },
  // bail: 1,  // showing as unknown config value, broken on Jest update?
  /** Jest will make the path to this directory the <rootDir> for all paths */
  rootDir: './../../',

  /** A list of paths to directories that Jest should use to search for test files */
  roots: [
    '<rootDir>/eleventy/config',
    '<rootDir>/eleventy/filters',
    '<rootDir>/eleventy/handlers',
    '<rootDir>/eleventy/nunjucksAsyncShortcodes',
    '<rootDir>/eleventy/nunjucksFilters',
    '<rootDir>/eleventy/nunjucksShortcodes',
    '<rootDir>/eleventy/pairedShortcodes',
    '<rootDir>/eleventy/shortcodes',
    '<rootDir>/eleventy/utils',
    '<rootDir>/lambda',
    '<rootDir>/scripts',
    '<rootDir>/src/__tests__',
    '<rootDir>/src/assets/scss/__tests__',
    '<rootDir>/src/assets/script/modules/serviceWorker/__tests__',
    '<rootDir>/test/jest/__tests__/node-env',
    '<rootDir>/test/jest/matchers',
  ],
  /**
   * Executed before each test file is executed but after
   * the testing framework is installed in the environment
   */
  setupFilesAfterEnv: [`<rootDir>/test/jest/jest.setup.node.ts`],
  /** Jest default environment is Node.js */
  testEnvironment: 'node',
  /**  Glob patterns Jest uses to detect test files. Default shown. */
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  /** Skip any tests that match these regexp pattern strings */
  testPathIgnorePatterns: ['<rootDir>/scripts/build/__tests__/jsdom'],
}

export default config
