/// <reference types="vitest" />
import { defineConfig } from 'vite'

// @TODO: Should set up `reporters` for CI to create an artifact on failed runs with `outputFIle`

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts?(x)', 'scripts/**/*.spec.ts'],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['src/lib/**', 'node'],
      ['scripts/**', 'node'],
    ],
    /** Timeout set to 30 seconds for all tests */
    testTimeout: 30 * 1000,
    // globalSetup: '',
    // setupFiles: '',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx,astro}', 'scripts/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'scripts/**/*.spec.ts',
        'src/**/__tests__/**',
        'scripts/**/__tests__/**',
        'src/@types/**',
        '@types/**',
        '**/*.d.ts',
      ],
      all: true,
      clean: true,
    },
  },
});
