/**
 * Social Shares Component Tests
 * Tests for social media sharing functionality including share URLs and Mastodon modal
 * @see src/components/Social/
 */

import type { BrowserContext, Page } from '@playwright/test'
import { BasePage, test, expect } from '@test/e2e/helpers'

const SHARE_FIXTURE = {
  path: '/testing/social-shares',
  url: 'https://astro.webstackbuilders.com/testing/social-shares',
  title: 'Testing Article: Future of Web Performance',
  description: 'Synthetic article metadata supplied solely for end-to-end validation of the social share experience.',
}

const SOCIAL_SHARE_SELECTOR = '[data-social-shares]'
const SHARE_BUTTON_SELECTOR = `${SOCIAL_SHARE_SELECTOR} [data-share]`
const EXPECTED_PLATFORMS = ['x', 'linkedin', 'bluesky', 'reddit', 'mastodon'] as const
const SHARE_DATA_TEXT = `${SHARE_FIXTURE.title} - ${SHARE_FIXTURE.description}`.trim()
const SHARE_MODAL_TEXT = `${SHARE_DATA_TEXT} ${SHARE_FIXTURE.url}`.trim()

async function loadSocialShareFixture(playwrightPage: Page) {
  const page = await BasePage.init(playwrightPage)
  await page.goto(SHARE_FIXTURE.path)
  await expect(page.locator(SOCIAL_SHARE_SELECTOR)).toBeVisible()
  return page
}

async function openSharePopup(
  playwrightPage: Page,
  context: BrowserContext,
  platform: (typeof EXPECTED_PLATFORMS)[number]
) {
  const page = await loadSocialShareFixture(playwrightPage)
  const shareButton = page.locator(`${SHARE_BUTTON_SELECTOR}[data-share="${platform}"]`).first()
  await expect(shareButton).toBeVisible()
  const popupPromise = context.waitForEvent('page')
  await shareButton.click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  return popup
}

test.describe('Social Shares Component', () => {
  test('renders social share component inside testing fixture', async ({ page: playwrightPage }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    const socialShares = page.locator(SOCIAL_SHARE_SELECTOR)
    await expect(socialShares).toBeVisible()
    await expect(socialShares.locator('.social-share__label')).toHaveText('Share:')
  })

  test('displays expected platforms with deterministic order', async ({ page: playwrightPage }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    const buttons = page.locator(SHARE_BUTTON_SELECTOR)
    await expect(buttons).toHaveCount(EXPECTED_PLATFORMS.length)
    const shareIds = await buttons.evaluateAll(elements => elements.map(el => el.getAttribute('data-share')))
    expect(shareIds.filter((value): value is string => Boolean(value))).toEqual(EXPECTED_PLATFORMS)
  })

  test('share buttons expose accessible labels', async ({ page: playwrightPage }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    const buttons = page.locator(SHARE_BUTTON_SELECTOR)
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      expect(ariaLabel?.trim()).toBeTruthy()
    }
  })

  test('x share encodes fixture title and url', async ({ page: playwrightPage, context }) => {
    const popup = await openSharePopup(playwrightPage, context, 'x')
    const popupUrl = new URL(popup.url())
    const validXHosts = ['twitter.com', 'x.com']
    expect(validXHosts).toContain(popupUrl.hostname)
    expect(popupUrl.searchParams.get('url')).toBe(SHARE_FIXTURE.url)
    expect(popupUrl.searchParams.get('text')).toBe(SHARE_DATA_TEXT)
    await popup.close()
  })

  test('linkedin share exposes encoded href and launches LinkedIn window', async ({ page: playwrightPage, context }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    const linkedinButton = page.locator(`${SHARE_BUTTON_SELECTOR}[data-share="linkedin"]`).first()
    await expect(linkedinButton).toBeVisible()

    const href = await linkedinButton.getAttribute('href')
    expect(href).toBeTruthy()
    if (href) {
      const hrefUrl = new URL(href)
      expect(hrefUrl.hostname).toContain('linkedin.com')
      expect(hrefUrl.searchParams.get('url')).toBe(SHARE_FIXTURE.url)
    }

    const popupPromise = context.waitForEvent('page')
    await linkedinButton.click()
    const popup = await popupPromise
    const popupUrl = new URL(popup.url())
    expect(popupUrl.hostname).toContain('linkedin.com')
    const validLinkedinPaths = ['/sharing/share-offsite', '/uas/login']
    expect(validLinkedinPaths.some(path => popupUrl.pathname.startsWith(path))).toBe(true)
    await popup.close()
  })

  test('bluesky share concatenates share text and url (href)', async ({ page: playwrightPage }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    const blueskyButton = page.locator(`${SHARE_BUTTON_SELECTOR}[data-share="bluesky"]`).first()
    await expect(blueskyButton).toBeVisible()

    const href = await blueskyButton.getAttribute('href')
    expect(href).toBeTruthy()
    if (!href) {
      return
    }

    const hrefUrl = new URL(href)
    expect(hrefUrl.hostname).toContain('bsky.app')
    const textParam = hrefUrl.searchParams.get('text')
    expect(textParam?.startsWith(SHARE_DATA_TEXT)).toBe(true)
    expect(textParam?.endsWith(SHARE_FIXTURE.url)).toBe(true)
  })

  test('bluesky share opens popup window (chromium only)', async ({ page: playwrightPage, context }, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip()
    }

    const popup = await openSharePopup(playwrightPage, context, 'bluesky')
    const popupUrl = new URL(popup.url())
    expect(popupUrl.hostname).toContain('bsky.app')
    await popup.close()
  })

  test('reddit share includes url and title parameters', async ({ page: playwrightPage, context }) => {
    const popup = await openSharePopup(playwrightPage, context, 'reddit')
    const popupUrl = new URL(popup.url())
    expect(popupUrl.hostname).toContain('reddit.com')
    expect(popupUrl.searchParams.get('url')).toBe(SHARE_FIXTURE.url)
    expect(popupUrl.searchParams.get('title')).toBe(SHARE_FIXTURE.title)
    await popup.close()
  })

  test('mastodon share delegates to modal helper', async ({ page: playwrightPage }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    const mastodonButton = page.locator(`${SHARE_BUTTON_SELECTOR}[data-share="mastodon"]`).first()
    await page.evaluate(() => {
      const windowWithModal = window as Window & { openMastodonModal?: (_text: string) => void; mastodonPayload?: string }
      delete windowWithModal.mastodonPayload
      windowWithModal.openMastodonModal = (text: string) => {
        windowWithModal.mastodonPayload = text
      }
    })

    await mastodonButton.click()
    const payload = await page.evaluate(() => (window as Window & { mastodonPayload?: string }).mastodonPayload)
    expect(payload).toBe(SHARE_MODAL_TEXT)
  })

  test('social shares remain reachable on small viewports', async ({ page: playwrightPage }) => {
    const page = await loadSocialShareFixture(playwrightPage)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.locator(SOCIAL_SHARE_SELECTOR)).toBeVisible()

    const socialShares = page.locator(SOCIAL_SHARE_SELECTOR)
    await expect(socialShares).toBeVisible()
    await expect(socialShares.locator('[data-share]')).toHaveCount(EXPECTED_PLATFORMS.length)
  })
})
