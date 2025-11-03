/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'
import { resolve } from 'path'

// @TODO: Should set up `reporters` for CI to create an artifact on failed runs with `outputFIle`

export default getViteConfig({
  define: {
    'import.meta.env.DEV': true,
    'import.meta.env.PROD': false,
    'import.meta.env.SSR': true,
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, './src/assets'),
      '@components': resolve(__dirname, './src/components'),
      '@content': resolve(__dirname, './src/content'),
      '@data': resolve(__dirname, './src/data'),
      '@layouts': resolve(__dirname, './src/layouts'),
      '@lib': resolve(__dirname, './src/lib'),
      '@styles': resolve(__dirname, './src/styles'),
      '@test': resolve(__dirname, './test'),
      'astro:transitions/client': resolve(__dirname, './test/__mocks__/astro:transitions/client.ts'),
      'focus-trap': resolve(__dirname, './test/__mocks__/focus-trap.ts'),
    },
  },
  test: {
    include: [
      'src/**/*.spec.ts?(x)',
      'scripts/**/*.spec.ts',
      'api/**/*.spec.ts',
      'test/unit/**/*.spec.ts',
      'test/e2e/helpers/__tests__/**/*.spec.ts',
    ],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['src/lib/**', 'node'],
      ['scripts/**', 'node'],
      ['api/**', 'node'],
      ['test/unit/**', 'node'],
      ['test/e2e/helpers/__tests__/**', 'node'],
    ],
    env: {
      DEV: 'true',
      PROD: 'false',
      SSR: 'true',
    },
    testTimeout: 30 * 1000,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)
