/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

// @TODO: Should set up `reporters` for CI to create an artifact on failed runs with `outputFIle`

export default getViteConfig({
  // @ts-expect-error - `test` is not a valid Vite config option
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
});
