/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

// @TODO: Should set up `reporters` for CI to create an artifact on failed runs with `outputFIle`

export default getViteConfig({
  /** Root directory that Jest should scan for tests and modules within */
  rootDir: './',
  /** To place configuration elsewhere, point to the path of the config file in projects */
  // @TODO: This is for Jest
  projects: [
    '<rootDir>/test/unit/vitest.config.jsdom.ts',
    '<rootDir>/test/unit/vitest.config.node.ts'
  ],
  test: {
    include: ['src/**/*.spec.ts?(x)'],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['src/lib/**', 'node'],
    ],
    // globalSetup: '',
    // setupFiles: '',
    /*
    coverage: {
      enabled: false,
      extension: ['.ts', '.tsx', '.astro'],
    },
    */
  },
  /** Timeout set to 30 seconds for all tests */
  testTimeout: 30 * 1000
});
