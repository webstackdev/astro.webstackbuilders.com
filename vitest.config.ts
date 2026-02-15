/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { createLogger, type LogOptions } from 'vite'
import { getSiteUrl } from './src/lib/config'

loadEnv({ path: resolve(process.cwd(), '.env.development'), override: false, quiet: true } as never)

/**
 * Needed to be able to skip running integrations in astro.config.ts
 * during unit tests
 */
process.env['VITEST'] = 'true'

const shouldShowVitestLogs = Boolean(process.env['VITEST_SHOW_LOGS'])

const stripAnsi = (value: string): string => value

const shouldSuppressEarlyVitestOutput = (value: string): boolean => {
  const cleanValue = stripAnsi(value)
  return (
    /\[astro-icon\]\s*Loaded icons/i.test(cleanValue) ||
    /Loaded icons from/i.test(cleanValue) ||
    /Local icons changed, reloading/i.test(cleanValue) ||
    // Vite SSR module runner teardown noise: the transport between the test
    // worker and Vite closes before astro:db / db/seed.ts finish evaluating.
    // Harmless — tests have already passed at this point.
    /transport was disconnected/i.test(cleanValue)
  )
}

const wrapWriteWithEarlyVitestFilter = (write: typeof process.stdout.write): typeof process.stdout.write => {
  return ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
    try {
      const bufferEncoding: BufferEncoding =
        typeof encoding === 'string' && Buffer.isEncoding(encoding) ? encoding : 'utf8'

      const text =
        typeof chunk === 'string'
          ? chunk
          : Buffer.isBuffer(chunk)
            ? chunk.toString(bufferEncoding)
            : String(chunk)

      if (text && shouldSuppressEarlyVitestOutput(text)) {
        if (typeof cb === 'function') cb()
        return true
      }
    } catch {
      // If something goes sideways, never block writes.
    }

    return (write as unknown as (_value: unknown, _enc?: unknown, _callback?: unknown) => boolean)(
      chunk as never,
      encoding as never,
      cb as never
    )
  }) as typeof process.stdout.write
}

if (!shouldShowVitestLogs) {
  process.stdout.write = wrapWriteWithEarlyVitestFilter(process.stdout.write.bind(process.stdout))
  process.stderr.write = wrapWriteWithEarlyVitestFilter(process.stderr.write.bind(process.stderr))
}

const viteLogger = createLogger('error', { allowClearScreen: false })

export default getViteConfig({
  logLevel: 'error',
  customLogger: {
    ...viteLogger,
    info: (message: string, options?: LogOptions) => {
      if (/\[astro-icon\] Loaded icons/i.test(message) || /Loaded icons from/i.test(message)) return
      viteLogger.info(message, options)
    },
    error: (message: string, options?: LogOptions) => {
      if (/transport was disconnected/i.test(message)) return
      viteLogger.error(message, options)
    },
  },
  define: {
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
    mode: 'development',
    include: [
      'src/**/*.spec.ts?(x)',
      'scripts/**/*.spec.ts',
      'api/**/*.spec.ts',
      'test/unit/**/*.spec.ts',
      'test/eslint/__tests__/**/*.spec.ts',
      'test/e2e/helpers/__tests__/**/*.spec.ts',
      '.github/actions/**/__tests__/**/*.spec.ts',
    ],
    environmentMatchGlobs: [
      ['src/components/**', 'node'],
      ['src/**', 'happy-dom'],
      ['src/lib/**', 'node'],
      ['scripts/**', 'node'],
      ['src/pages/api/**', 'node'],
      ['test/unit/**', 'node'],
      ['test/eslint/__tests__/**', 'node'],
      ['test/e2e/helpers/__tests__/**', 'node'],
      ['.github/actions/**', 'node'],
    ],
    env: {
      DEV: 'true',
      MODE: 'development',
      NODE_ENV: 'development',
      PROD: 'false',
      VITEST: 'true',
    },
    // Use GitHub Actions reporter when running in CI so tests produce
    // actionable annotations in the Actions UI. Vitest 1.3.0+ includes
    // a built-in 'github-actions' reporter, so we rely on that here.
    reporters: process.env['GITHUB_ACTIONS'] ? ['default', 'github-actions'] :
      'default',
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
