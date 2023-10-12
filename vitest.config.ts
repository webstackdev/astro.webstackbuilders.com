/// <reference types="vitest" />
// https://vitest.dev/config/
import { getViteConfig } from 'astro/config'

// @TODO: Should set up `reporters` for CI to create an artifact on failed runs with `outputFIle`

// https://vitest.dev/guide/environment.html

export default getViteConfig({
  test: {
    include: ['src/**/*.spec.ts?(x)'],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['src/lib/**', 'node'],
    ],
    // globalSetup: '',
    // setupFiles: '',
    coverage: {
      enabled: false,
      extension: ['.ts', '.tsx', '.astro'],
    },
  },
})
