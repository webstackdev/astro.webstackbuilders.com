import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/** Debug mode - set DEBUG=1 or DEBUG=true to run only chromium with no HTML report */
const isDebugMode = Boolean(process.env['DEBUG'] && process.env['DEBUG'] !== 'false' && process.env['DEBUG'] !== '0')

export default defineConfig({
  /* Look for test files in the "tests" directory, relative to this configuration file. */
  testDir: './test/e2e/specs',
  /* Glob patterns or regular expressions that match test files. */
  testMatch: '**/*.spec.ts',
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
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : '75%',
  /* Only run @ready tests in CI, all tests locally */
  ...(process.env['CI'] ? { grep: /@ready/ } : {}),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env['CI']
    ? 'github'
    : isDebugMode
      ? [
          ['list'],
          ['json', { outputFile: '.cache/playwright/results.json' }],
        ]
      : [
          ['list'],
          ['html', { outputFolder: `.cache/playwright/reports/` }],
          ['json', { outputFile: '.cache/playwright/results.json' }],
        ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
      /** Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4321',
    ignoreHTTPSErrors: true,
    /** Capture screenshot after each test failure, other options are 'on' and 'off'. */
    screenshot: 'only-on-failure',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  /* In debug mode, assume server is already running */
  ...(isDebugMode
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:4321',
          /** How long to wait for the process to start up and be available in milliseconds. */
          timeout: 120 * 1000,
          reuseExistingServer: !process.env['CI'],
        },
      }),

  globalSetup: './test/e2e/config/global-setup.ts',

  // path to the global teardown files.
  //globalTeardown: require.resolve('./global-teardown'),

  // Each test is given 30 seconds.
  //timeout: 30000,
})
