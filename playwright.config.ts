import { defineConfig, devices } from '@playwright/test'
import { testDatabaseFile } from './test/e2e/config/runtime/paths'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv'
import { isCI } from 'src/lib/config/environmentServer'

if (!isCI()) {
  dotenv.config({ path: '.env.development', quiet: true })
}

process.env['ASTRO_DATABASE_FILE'] = process.env['ASTRO_DATABASE_FILE'] ?? testDatabaseFile
process.env['PLAYWRIGHT'] = process.env['PLAYWRIGHT'] ?? 'true'

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/** Debug mode - set CI=1 or CI=true to run only chromium with no HTML report */
const isCIMode = Boolean(process.env['CI'] && (process.env['CI'] === 'true') || process.env['CI'] === '1')

const buildWebServerEnv = () => {
  const env: Record<string, string> = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      env[key] = value
    }
  }

  env['PLAYWRIGHT'] = 'true'
  env['ASTRO_DATABASE_FILE'] = testDatabaseFile

  return env
}

//const workersHighParallel = process.env['GITHUB_ACTIONS'] ? 1 : 1
const testMatch = '**/*.spec.ts'
const testIgnore = [
  '05-api/**/*.spec.ts',
  '06-actions/**/*.spec.ts',
]

export default defineConfig({
  /** Look for test files in the "tests" directory, relative to this configuration file. */
  testDir: './test/e2e/specs',
  /** Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: `.cache/playwright/output/`,
  /** Tracked by Git LFS */
  snapshotPathTemplate: './test/e2e/__screenshots__/{testFilePath}/{arg}{ext}',
  /** Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /** Run tests in files in parallel */
  fullyParallel: true,
  /** Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['GITHUB_ACTIONS'],
  /** Retry on CI only */
  retries: process.env['GITHUB_ACTIONS'] ? 2 : 0,
  /**
   * Global maximum workers. Setting to 1 forces serial mode for tests. Setting
   * higher causes flakiness especially in mobile-safari tests due to resource
   * contention on Vite dev server.
   */
  workers: 1,
  /** Only run `@ready` tests in CI, all tests locally */
  ...(process.env['GITHUB_ACTIONS'] ? { grep: /@ready/ } : {}),
  /** Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env['GITHUB_ACTIONS']
    ? 'github'
    : isCIMode
      ? [
          ['list'],
          ['json', { outputFile: '.cache/playwright/results.json' }],
        ]
      : [
          ['list'],
          ['html', { outputFolder: `.cache/playwright/reports/` }],
          ['json', { outputFile: '.cache/playwright/results.json' }],
        ],
  /** Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
      /** Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /** Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4321',
    ignoreHTTPSErrors: true,
    /** Capture screenshot after each test failure, other options are 'on' and 'off'. */
    screenshot: 'only-on-failure',
    /** Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  projects: [
    /**
     * ===========================================================================================
     *
     * Most tests run in parallel across all major browsers
     *
     * ==========================================================================================
     */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch,
      testIgnore,
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch,
      testIgnore,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch,
      testIgnore,
    },

    /** Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch,
      testIgnore,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch,
      testIgnore,
    },

    /** Test against branded browsers. */
    {
      name: 'microsoft-edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      testMatch,
      testIgnore,
    },
    {
      name: 'google-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      testMatch,
      testIgnore,
    },

    /**
     * ===========================================================================================
     *
     * API and Actions tests are only using the browser to fetch so no need to run
     * across browsers. They run serially to avoid SQLite write contention issues.
     *
     * ===========================================================================================
     */

    {
      name: 'api',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '05-api/**/*.spec.ts',
    },

    {
      name: 'actions',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '06-actions/**/*.spec.ts',
    },
  ],

  /** Run your local dev server before starting the tests */
  /** In debug mode, assume server is already running */
  ...(isCIMode
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:4321',
          /** How long to wait for the process to start up and be available in milliseconds. */
          timeout: 120 * 1000,
          reuseExistingServer: !process.env['CI'],
          env: buildWebServerEnv(),
        },
      }),

  globalSetup: './test/e2e/config/global-setup.ts',
  globalTeardown: './test/e2e/config/global-teardown.ts',
})
