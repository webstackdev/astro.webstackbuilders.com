/**
 * Consent Preferences Component Tests
 * Exercises the consent route which hosts the consent-preferences component inline
 */

import type { Page } from '@playwright/test'
import { BasePage, expect, test, mockFetchEndpointResponse, type FetchOverrideHandle } from '@test/e2e/helpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'
import type { ConsentResponse } from '@actions/gdpr/@types'
import { deleteConsentRecordsBySubjectId, waitForConsentRecord } from '@test/e2e/db'

const ALLOW_ALL_BUTTON = '#consent-allow-all'
const SAVE_BUTTON = '#consent-save-preferences'
const COMPONENT_SELECTOR = 'consent-preferences'
const FULL_STACK_TAG = '@containers'
const CONSENT_PAGE_PATH = '/consent'

const toggleLabel = (checkboxId: string): string => `[data-consent-toggle="${checkboxId}"]`

const decodeAstroActionJson = (raw: unknown): unknown => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return raw
  }

  const table = raw

  const decodeAt = (index: number): unknown => {
    const value = table[index]

    if (Array.isArray(value)) {
      return value.map((entry) => {
        if (typeof entry === 'number') {
          return decodeAt(entry)
        }
        return entry
      })
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>
      const decoded: Record<string, unknown> = {}
      for (const [key, ref] of Object.entries(obj)) {
        decoded[key] = typeof ref === 'number' ? decodeAt(ref) : ref
      }
      return decoded
    }

    return value
  }

  return decodeAt(0)
}

const interceptConsentApi = async (page: Page): Promise<FetchOverrideHandle> => {
  return await mockFetchEndpointResponse(page, {
    endpoint: '/_actions/gdpr.consentCreate',
    responseBuilder: 'consentRecord',
  })
}

async function removeViteErrorOverlay(page: BasePage): Promise<void> {
  await page.evaluate(() => {
    const styleId = 'disable-vite-overlay-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        vite-error-overlay {
          pointer-events: none !important;
          opacity: 0 !important;
          display: none !important;
        }
      `
      document.head.append(style)
    }

    document.querySelectorAll('vite-error-overlay').forEach((element) => {
      element.remove()
    })
  })
}

async function waitForConsentPreferences(page: BasePage): Promise<void> {
  await page.locator(COMPONENT_SELECTOR).waitFor({ state: 'attached' })
  await page.waitForFunction(() => {
    const element = document.querySelector<HTMLElement>('consent-preferences')
    return element?.dataset?.['consentPreferencesReady'] === 'true'
  }, undefined, { timeout: wait.defaultWait })
}

test.describe('Consent Preferences Component', () => {
  let consentApiOverride: FetchOverrideHandle | null = null

  test.beforeEach(async ({ page: playwrightPage, context }, testInfo) => {
    const page = await BasePage.init(playwrightPage)
    const shouldMockConsentApi = !testInfo.title.includes(FULL_STACK_TAG)

    if (shouldMockConsentApi) {
      consentApiOverride = await interceptConsentApi(playwrightPage)
    } else {
      consentApiOverride = null
    }

    await context.clearCookies()
    await page.goto(CONSENT_PAGE_PATH, { timeout: wait.navigation })
    await playwrightPage.waitForLoadState('networkidle')
    await removeViteErrorOverlay(page)
    await waitForConsentPreferences(page)
  })

  test.afterEach(async () => {
    if (consentApiOverride) {
      await consentApiOverride.restore()
      consentApiOverride = null
    }
  })

  test('@containers full stack consent submission hits backend mocks', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    const analyticsCheckbox = page.locator('#analytics-cookies')
    const functionalCheckbox = page.locator('#functional-cookies')
    const marketingCheckbox = page.locator('#marketing-cookies')

    const expectedPurposes = ['analytics', 'functional', 'marketing']

    const consentResponsePromise = page.waitForResponse((response) => {
      if (!response.url().includes('/_actions/gdpr.consentCreate')) return false
      if (response.request().method() !== 'POST') return false

      try {
        const postData = response.request().postData()
        if (!postData) return false

        const payload = JSON.parse(postData) as { purposes?: string[] }
        const purposes = payload.purposes ?? []
        return expectedPurposes.every((purpose) => purposes.includes(purpose))
      } catch {
        return false
      }
    })

    await page.locator(ALLOW_ALL_BUTTON).click()

    await page.locator(SAVE_BUTTON).click()

    const consentResponse = await consentResponsePromise
    expect(consentResponse.ok()).toBeTruthy()

    const rawBody = (await consentResponse.json()) as unknown
    const responseBody = (() => {
      const decoded = decodeAstroActionJson(rawBody)

      if (decoded && typeof decoded === 'object') {
        if ('success' in decoded) {
          return decoded as ConsentResponse
        }

        if ('data' in decoded) {
          const data = (decoded as { data?: unknown }).data
          if (data && typeof data === 'object' && 'success' in data) {
            return data as ConsentResponse
          }
        }
      }

      throw new Error(`Unexpected consent action response shape: ${JSON.stringify(rawBody).slice(0, 500)}`)
    })()

    expect(responseBody.success).toBeTruthy()

    const dataSubjectId = responseBody.record?.DataSubjectId
    expect(dataSubjectId).toBeTruthy()
    if (!dataSubjectId) {
      throw new Error('Consent API did not return a DataSubjectId')
    }

    let cleanupId: string | null = null
    try {
      const record = await waitForConsentRecord(dataSubjectId, expectedPurposes)
      cleanupId = record.dataSubjectId

      await expect(analyticsCheckbox).toBeChecked()
      await expect(functionalCheckbox).toBeChecked()
      await expect(marketingCheckbox).toBeChecked()
    } finally {
      if (cleanupId) {
        await deleteConsentRecordsBySubjectId(cleanupId)
      }
    }
  })

  test('@ready component renders headings and CTAs', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    await expect(page.locator(COMPONENT_SELECTOR)).toBeVisible()
    await expect(page.locator('consent-preferences h2:has-text("Privacy Preference Center")')).toBeVisible()
    await expect(page.locator('#consent-deny-all')).toBeVisible()
    await expect(page.locator(ALLOW_ALL_BUTTON)).toBeVisible()
    await expect(page.locator(SAVE_BUTTON)).toBeVisible()
  })

  test('@ready toggles can be updated and saved', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    const analyticsCheckbox = page.locator('#analytics-cookies')
    const functionalCheckbox = page.locator('#functional-cookies')
    const marketingCheckbox = page.locator('#marketing-cookies')

    await page.locator(ALLOW_ALL_BUTTON).click()

    await page.locator(toggleLabel('analytics-cookies')).click()
    await page.locator(toggleLabel('functional-cookies')).click()
    await page.locator(toggleLabel('marketing-cookies')).click()

    await expect(analyticsCheckbox).not.toBeChecked()
    await expect(functionalCheckbox).not.toBeChecked()
    await expect(marketingCheckbox).not.toBeChecked()

    await page.locator(SAVE_BUTTON).click()
    await expect(analyticsCheckbox).not.toBeChecked()
    await expect(functionalCheckbox).not.toBeChecked()
    await expect(marketingCheckbox).not.toBeChecked()
  })

  test('@ready Allow All enables every category', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    const analyticsCheckbox = page.locator('#analytics-cookies')
    const functionalCheckbox = page.locator('#functional-cookies')
    const marketingCheckbox = page.locator('#marketing-cookies')

    await page.locator(ALLOW_ALL_BUTTON).click()
    await page.locator(toggleLabel('functional-cookies')).click()
    await expect(functionalCheckbox).not.toBeChecked()

    await page.locator(ALLOW_ALL_BUTTON).click()

    await expect(analyticsCheckbox).toBeChecked()
    await expect(functionalCheckbox).toBeChecked()
    await expect(marketingCheckbox).toBeChecked()

  })
})
