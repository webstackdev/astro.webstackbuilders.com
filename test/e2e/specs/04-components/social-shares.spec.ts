/**
 * Social Shares Component Tests
 * Tests for social media sharing functionality including Web Share API
 * @see src/components/Social/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'


test.describe('Social Shares Component', () => {
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Go to an article page (social shares usually appear on articles)
    await page.goto('/articles')
    // Click first article
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')
  })

  test.skip('@wip social share buttons are visible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Social share component should be visible on article pages
    const socialShares = page.locator('[data-social-shares]')
    await expect(socialShares).toBeVisible()
  })

  test.skip('@wip displays common social platforms', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Should have buttons for Twitter, LinkedIn, Facebook, etc.
    const socialShares = page.locator('[data-social-shares]')

    // At least one social button should be visible
    const count = await socialShares.locator('button, a').count()
    expect(count).toBeGreaterThan(0)

    // Verify common platforms exist
    const hasTwitter = (await socialShares.locator('[data-share="twitter"]').count()) > 0
    const hasLinkedin = (await socialShares.locator('[data-share="linkedin"]').count()) > 0
    const hasFacebook = (await socialShares.locator('[data-share="facebook"]').count()) > 0

    expect(hasTwitter || hasLinkedin || hasFacebook).toBe(true)
  })

  test.skip('@wip share buttons have accessible labels', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: All share buttons should have aria-label or text
    const socialShares = page.locator('[data-social-shares]')
    const buttons = socialShares.locator('button, a')

    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()

      expect(ariaLabel || text?.trim()).toBeTruthy()
    }
  })

  test.skip('@wip clicking Twitter share opens new window', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Twitter share should open in new window
    const socialShares = page.locator('[data-social-shares]')
    const twitterButton = socialShares.locator('[data-share="twitter"]').first()

    if ((await twitterButton.count()) === 0) {
      test.skip()
    }

    // Listen for new page
    const pagePromise = context.waitForEvent('page')
    await twitterButton.click()

    const newPage = await pagePromise
    expect(newPage.url()).toContain('twitter.com')

    await newPage.close()
  })

  test.skip('@wip clicking LinkedIn share opens new window', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Expected: LinkedIn share should open in new window
    const socialShares = page.locator('[data-social-shares]')
    const linkedinButton = socialShares.locator('[data-share="linkedin"]').first()

    if ((await linkedinButton.count()) === 0) {
      test.skip()
    }

    const pagePromise = context.waitForEvent('page')
    await linkedinButton.click()

    const newPage = await pagePromise
    expect(newPage.url()).toContain('linkedin.com')

    await newPage.close()
  })

  test.skip('@wip share URLs include current page URL', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Share links should include the current article URL
    const currentUrl = page.url()
    const socialShares = page.locator('[data-social-shares]')
    const twitterButton = socialShares.locator('[data-share="twitter"]').first()

    if ((await twitterButton.count()) === 0) {
      test.skip()
    }

    const pagePromise = context.waitForEvent('page')
    await twitterButton.click()

    const newPage = await pagePromise
    const shareUrl = newPage.url()

    // Check if current URL is encoded in the share URL
    const encodedUrl = encodeURIComponent(currentUrl)
    expect(shareUrl).toContain(encodedUrl)

    await newPage.close()
  })

  test.skip('@wip share URLs include page title', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Share links should include the article title
    const pageTitle = await page.title()
    const socialShares = page.locator('[data-social-shares]')
    const twitterButton = socialShares.locator('[data-share="twitter"]').first()

    if ((await twitterButton.count()) === 0) {
      test.skip()
    }

    const pagePromise = context.waitForEvent('page')
    await twitterButton.click()

    const newPage = await pagePromise
    const shareUrl = newPage.url()

    // Title might be encoded
    const encodedTitle = encodeURIComponent(pageTitle)
    expect(shareUrl).toContain(encodedTitle.substring(0, 20)) // Partial match

    await newPage.close()
  })

  test.skip('@wip native share button uses Web Share API', async ({ page: playwrightPage, browserName }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Native share button should trigger Web Share API
    // Skip on browsers that don't support Web Share API in test environment
    if (browserName !== 'chromium') {
      test.skip()
    }

    const socialShares = page.locator('[data-social-shares]')
    const nativeShareButton = socialShares.locator('[data-share="native"]')

    if ((await nativeShareButton.count()) === 0) {
      test.skip()
    }

    // Mock the navigator.share API
    await page.evaluate(() => {
      // @ts-ignore
      window.navigator.share = async () => {
        return Promise.resolve()
      }
    })

    await nativeShareButton.click()
    // If no error, Web Share API was called successfully
  })

  test.skip('@wip copy link button copies URL to clipboard', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Copy button should copy current URL to clipboard
    await context.grantPermissions(['clipboard-write', 'clipboard-read'])

    const socialShares = page.locator('[data-social-shares]')
    const copyButton = socialShares.locator('[data-share="copy"]')

    if ((await copyButton.count()) === 0) {
      test.skip()
    }

    const currentUrl = page.url()
    await copyButton.click()
    await page.waitForTimeout(500)

    // Read clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(currentUrl)
  })

  test.skip('@wip copy link button shows confirmation', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Expected: After copying, should show confirmation message
    await context.grantPermissions(['clipboard-write'])

    const socialShares = page.locator('[data-social-shares]')
    const copyButton = socialShares.locator('[data-share="copy"]')

    if ((await copyButton.count()) === 0) {
      test.skip()
    }

    await copyButton.click()
    await page.waitForTimeout(300)

    // Look for confirmation (text change, tooltip, or notification)
    const buttonText = await copyButton.textContent()
    const ariaLabel = await copyButton.getAttribute('aria-label')

    expect(buttonText?.toLowerCase().includes('copied') || ariaLabel?.toLowerCase().includes('copied')).toBe(
      true
    )
  })

  test.skip('@wip email share opens mailto link', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Email share should use mailto: protocol
    const socialShares = page.locator('[data-social-shares]')
    const emailButton = socialShares.locator('[data-share="email"]')

    if ((await emailButton.count()) === 0) {
      test.skip()
    }

    const href = await emailButton.getAttribute('href')
    expect(href).toContain('mailto:')
  })

  test.skip('@wip social shares are responsive', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Social shares should work on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    const socialShares = page.locator('[data-social-shares]')
    await expect(socialShares).toBeVisible()

    // Buttons should still be clickable
    const buttons = socialShares.locator('button, a')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
  })
})
