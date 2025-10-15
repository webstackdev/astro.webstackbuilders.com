/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'

// @TODO: Should set up `reporters` for CI to create an artifact on failed runs with `outputFIle`

export default defineConfig({
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@content': path.resolve(__dirname, './src/content'),
      '@data': path.resolve(__dirname, './src/data'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@test': path.resolve(__dirname, './test'),
      'astro:transitions/client': path.resolve(__dirname, './test/__mocks__/astro:transitions/client.ts'),
      'focus-trap': path.resolve(__dirname, './test/__mocks__/focus-trap.ts'),
    },
  },
  test: {
    include: ['src/**/*.spec.ts?(x)', 'scripts/**/*.spec.ts', 'api/**/*.spec.ts'],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['src/lib/**', 'node'],
      ['scripts/**', 'node'],
      ['api/**', 'node'],
    ],
    /** Timeout set to 30 seconds for all tests */
    testTimeout: 30 * 1000,
    // globalSetup: '',
    setupFiles: ['./vitest.setup.ts'],
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
