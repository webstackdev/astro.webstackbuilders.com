/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'
import { resolve } from 'path'
import { getSiteUrl } from './src/lib/config'

export default getViteConfig({
  define: {
    'import.meta.env.DEV': true,
    'import.meta.env.MODE': JSON.stringify('development'),
    'import.meta.env.PROD': false,
    'import.meta.env.SITE': JSON.stringify(getSiteUrl()),
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, './src/assets'),
      '@cache/*': resolve(__dirname, './cache'),
      '@components': resolve(__dirname, './src/components'),
      '@content': resolve(__dirname, './src/content'),
      '@data': resolve(__dirname, './src/data'),
      '@layouts': resolve(__dirname, './src/layouts'),
      '@lib': resolve(__dirname, './src/lib'),
      '@pages': resolve(__dirname, './src/pages'),
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
      'test/eslint/__tests__/**/*.spec.ts',
      'test/e2e/helpers/__tests__/**/*.spec.ts',
    ],
    environmentMatchGlobs: [
      ['src/**', 'happy-dom'],
      ['src/lib/**', 'node'],
      ['scripts/**', 'node'],
      ['src/pages/api/**', 'node'],
      ['test/unit/**', 'node'],
      ['test/eslint/__tests__/**', 'node'],
      ['test/e2e/helpers/__tests__/**', 'node'],
    ],
    env: {
      DEV: 'true',
      MODE: 'test',
      NODE_ENV: 'development',
      PROD: 'false',
      VITEST: 'true',
    },
    // Use GitHub Actions reporter when running in CI so tests produce
    // actionable annotations in the Actions UI. Vitest 1.3.0+ includes
    // a built-in 'github-actions' reporter, so we rely on that here.
  reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] : 'default',
    testTimeout: 30 * 1000,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
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
