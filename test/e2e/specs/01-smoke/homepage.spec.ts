/**
 * Homepage Smoke Test
 * Dedicated test for homepage basic functionality and app initialization
 */
import {
  test,
  expect,
  setupConsoleErrorChecker,
  logConsoleErrors,
} from '@test/e2e/helpers'

test.describe('Homepage @smoke', () => {
  // Clear localStorage before each test to avoid stale data issues
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test('@ready homepage loads successfully', async ({ page }) => {
    // Listen for console messages to check app initialization
    // IMPORTANT: Register listener BEFORE navigation to catch early messages
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      consoleMessages.push(msg.text())
    })

    await page.goto('/')

    // Verify page loaded
    await expect(page).toHaveTitle(/Webstack Builders/)

    // Verify main content is visible
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    // Wait a moment for all console messages to be captured
    await page.waitForTimeout(500)

    // Debug: log all console messages
    console.log('All console messages:', consoleMessages)

    // Verify app state initialized without errors
    const hasInitMessage = consoleMessages.some((msg) => msg.includes('App state initialized'))
    const hasErrorMessage = consoleMessages.some((msg) =>
      msg.includes('App state initialized with errors')
    )

    expect(hasInitMessage).toBe(true)
    expect(hasErrorMessage).toBe(false)
  })

  test('@ready homepage has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    const allMessages: Array<{ type: string; text: string }> = []

    // Capture ALL console messages for debugging
    page.on('console', (msg) => {
      allMessages.push({ type: msg.type(), text: msg.text() })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Trigger user interaction to execute delayed scripts
    await page.mouse.move(100, 100)

    // Wait for delayed scripts to execute
    await page.waitForTimeout(1000)

    // Debug: log all messages
    console.log('\nAll console messages by type:')
    console.log('Errors:', allMessages.filter(m => m.type === 'error').length)
    console.log('Warnings:', allMessages.filter(m => m.type === 'warning').length)
    console.log('Info:', allMessages.filter(m => m.type === 'info').length)
    console.log('Log:', allMessages.filter(m => m.type === 'log').length)

    if (allMessages.filter(m => m.type === 'error').length > 0) {
      console.log('\nError messages:')
      allMessages.filter(m => m.type === 'error').forEach(m => console.log(`  - ${m.text}`))
    }

    logConsoleErrors(errorChecker)

    // Fail if there are any unexpected 404s or errors
    expect(errorChecker.getFilteredErrors()).toHaveLength(0)
    expect(errorChecker.getFiltered404s()).toHaveLength(0)
  })
})