/**
 * Consent Preferences Component Tests
 * Exercises the consent route which hosts the consent-preferences component inline
 */

import type { Page } from '@playwright/test'
import { env } from 'node:process'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { BasePage, expect, mocksEnabled, test, mockFetchEndpointResponse, type FetchOverrideHandle } from '@test/e2e/helpers'
import type { ConsentResponse } from '@pages/api/_contracts/gdpr.contracts'

const ALLOW_ALL_BUTTON = '#consent-allow-all'
const SAVE_BUTTON = '#consent-save-preferences'
const COMPONENT_SELECTOR = 'consent-preferences'
const FULL_STACK_TAG = '@containers'
const CONSENT_PAGE_PATH = '/consent'

const SUPABASE_URL = env['SUPABASE_URL']?.replace(/\/$/, '')
const SUPABASE_SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

const supabaseAdminClient: SupabaseClient | null = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

const toggleLabel = (checkboxId: string): string => `[data-consent-toggle="${checkboxId}"]`

const interceptConsentApi = async (page: Page): Promise<FetchOverrideHandle> => {
  return await mockFetchEndpointResponse(page, {
    endpoint: '/api/gdpr/consent',
    responseBuilder: 'consentRecord',
  })
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

type ConsentRecordRow = {
  id: string
  data_subject_id: string
  purposes: string[]
  source: string | null
  timestamp: string
}

/**
 * Polls Supabase until the consent record for the provided subject includes the expected purposes.
 */
const waitForSupabaseConsentRecord = async (
  dataSubjectId: string,
  expectedPurposes: string[],
  timeoutMs = 7_000,
): Promise<ConsentRecordRow> => {
  if (!supabaseAdminClient) {
    throw new Error('Supabase admin client unavailable')
  }

  const deadline = Date.now() + timeoutMs
  let lastError: string | undefined

  while (Date.now() <= deadline) {
    const { data, error } = await supabaseAdminClient
      .from('consent_records')
      .select('id, data_subject_id, purposes, source, timestamp')
      .eq('data_subject_id', dataSubjectId)
      .order('timestamp', { ascending: false })
      .limit(1)

    if (error) {
      lastError = error.message
    } else if (data && data.length > 0) {
      const record = data[0]!
      const hasAllPurposes = expectedPurposes.every((purpose) => record.purposes?.includes(purpose))
      if (hasAllPurposes) {
        return record
      }
    }

    await wait(250)
  }

  throw new Error(lastError ?? 'Timed out waiting for consent record to persist in Supabase')
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
  }, undefined, { timeout: 5_000 })
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
    await page.goto(CONSENT_PAGE_PATH, { timeout: 15000 })
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
    test.skip(!mocksEnabled, 'E2E_MOCKS=1 is required to run Supabase-backed consent tests')
    test.skip(!supabaseAdminClient, 'Supabase containers must be running for full stack consent coverage')

    const page = await BasePage.init(playwrightPage)
    await waitForConsentPreferences(page)

    const analyticsCheckbox = page.locator('#analytics-cookies')
    const functionalCheckbox = page.locator('#functional-cookies')
    const marketingCheckbox = page.locator('#marketing-cookies')

    await page.locator(ALLOW_ALL_BUTTON).click()

    const consentResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/gdpr/consent') && response.request().method() === 'POST'
    })

    await page.locator(SAVE_BUTTON).click()

    const consentResponse = await consentResponsePromise
    expect(consentResponse.ok()).toBeTruthy()

    const responseBody = (await consentResponse.json()) as ConsentResponse
    expect(responseBody.success).toBeTruthy()

    const dataSubjectId = responseBody.record?.DataSubjectId
    expect(dataSubjectId).toBeTruthy()
    if (!dataSubjectId) {
      throw new Error('Consent API did not return a DataSubjectId')
    }

    const expectedPurposes = ['analytics', 'functional', 'marketing']

    let cleanupId: string | null = dataSubjectId
    try {
      const record = await waitForSupabaseConsentRecord(dataSubjectId, expectedPurposes)
      cleanupId = record.data_subject_id

      const sortedRecordPurposes = [...record.purposes].sort()
      const sortedExpectedPurposes = [...expectedPurposes].sort()
      expect(sortedRecordPurposes).toEqual(sortedExpectedPurposes)
      expect(record.source).toBe('cookies_modal')

      await expect(analyticsCheckbox).toBeChecked()
      await expect(functionalCheckbox).toBeChecked()
      await expect(marketingCheckbox).toBeChecked()
    } finally {
      if (cleanupId) {
        await supabaseAdminClient
          ?.from('consent_records')
          .delete()
          .eq('data_subject_id', cleanupId)
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
