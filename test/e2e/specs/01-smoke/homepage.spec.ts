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

    // Verify app state initialized without errors
    const hasInitMessage = consoleMessages.some((msg) => msg.includes('App state initialized'))
    const hasErrorMessage = consoleMessages.some((msg) =>
      msg.includes('App state initialized with errors')
    )

    expect(hasInitMessage).toBe(true)
    expect(hasErrorMessage).toBe(false)

    const themeKey = await page.evaluate(() => localStorage.getItem('theme'))
    expect(themeKey).toBe('default')

/*
    // 1. Start waiting for the 'console' event.
    const consoleMessagePromise = page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Hello from the browser!'),
      timeout: 5000, // Wait for a maximum of 5 seconds
    })

    // 2. Trigger the action that causes the log.
    await page.evaluate(() => {
      console.log('Hello from the browser!')
    })

    // 3. Await the promise to ensure the event was captured.
    const message = await consoleMessagePromise
    expect(message.text()).toBe('Hello from the browser!')

    // The test will wait for 5 seconds before failing with a TimeoutError
    await expect(consoleMessagePromise).rejects.toThrow('Timeout')
*/
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