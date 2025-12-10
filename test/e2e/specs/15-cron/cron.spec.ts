import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, mocksEnabled, test } from '@test/e2e/helpers'
import { ensureCronDependenciesHealthy } from '@test/e2e/helpers/cronHealth'
/**
 * These env helpers are safe to use in E2E test as they call process.env
 * directly. Must use "npm run dev:env" for this test case to pass.
 */
import {
  getCronSecret,
  getSuprabaseApiUrl,
  getSuprabaseApiServiceRoleKey,
 } from '@pages/api/_environment/environmentApi'

const CRON_SECRET = getCronSecret()
const SUPABASE_URL = getSuprabaseApiUrl()
const SUPABASE_SERVICE_ROLE_KEY = getSuprabaseApiServiceRoleKey()

const requiredEnvMissing = () => {
  if (!mocksEnabled) {
    return 'E2E_MOCKS=1 is required for cron API integration tests'
  }
  if (!CRON_SECRET) {
    return 'CRON_SECRET must be configured to call cron endpoints'
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return 'Supabase admin credentials are required to seed cron fixtures'
  }
  return null
}

const skipReason = requiredEnvMissing()

const supabaseAdmin: SupabaseClient | null = skipReason
  ? null
  : createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

const cronAuthHeader = CRON_SECRET ? `Bearer ${CRON_SECRET}` : null

const skipUnlessChromiumProject = () => {
  const projectName = test.info().project.name
  test.skip(projectName !== 'chromium', 'Cron tests run once via chromium project to avoid duplicates')
}

const dayInMs = 24 * 60 * 60 * 1000

const createdConfirmationIds = new Set<string>()
const createdDsarIds = new Set<string>()

const queueCleanup = (bucket: Set<string>, id: string) => {
  bucket.add(id)
  return id
}

const cleanupRecords = async (table: 'newsletter_confirmations' | 'dsar_requests', ids: Set<string>) => {
  if (!supabaseAdmin || ids.size === 0) {
    return
  }
  const values = Array.from(ids)
  await supabaseAdmin.from(table).delete().in('id', values)
  ids.clear()
}

const insertNewsletterConfirmation = async (options: {
  expiresAt: Date
  confirmedAt?: Date | null
  createdAt?: Date
}) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client unavailable')
  }
  const payload = {
    token: `cron-newsletter-${randomUUID()}`,
    email: `cron-newsletter-${Date.now()}@example.com`,
    data_subject_id: randomUUID(),
    expires_at: options.expiresAt.toISOString(),
    confirmed_at: options.confirmedAt ? options.confirmedAt.toISOString() : null,
    created_at: (options.createdAt ?? new Date()).toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_confirmations')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert newsletter confirmation: ${error?.message}`)
  }

  return queueCleanup(createdConfirmationIds, data.id)
}

const insertDsarRequest = async (options: {
  fulfilledAt?: Date | null
  createdAt?: Date
}) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client unavailable')
  }
  const payload = {
    token: `cron-dsar-${randomUUID()}`,
    email: `cron-dsar-${Date.now()}@example.com`,
    request_type: 'DELETE',
    expires_at: new Date(Date.now() + dayInMs).toISOString(),
    fulfilled_at: options.fulfilledAt ? options.fulfilledAt.toISOString() : null,
    created_at: (options.createdAt ?? new Date()).toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('dsar_requests')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert DSAR request: ${error?.message}`)
  }

  return queueCleanup(createdDsarIds, data.id)
}

const expectMissingById = async (table: 'newsletter_confirmations' | 'dsar_requests', id: string) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase client unavailable')
  }
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query ${table}: ${error.message}`)
  }

  expect(data).toBeNull()
}

test.describe('Cron API endpoints @ready', () => {
  test.describe.configure({ mode: 'serial' })

  if (skipReason) {
    test.skip(true, skipReason)
  } else {
    test.beforeAll(async () => {
      await ensureCronDependenciesHealthy({
        supabaseUrl: SUPABASE_URL!,
        supabaseServiceKey: SUPABASE_SERVICE_ROLE_KEY!,
        timeoutMs: 5000,
      })
    })
  }

  test.afterEach(async () => {
    await cleanupRecords('newsletter_confirmations', createdConfirmationIds)
    await cleanupRecords('dsar_requests', createdDsarIds)
  })

  test('@ready cleanup-confirmations removes expired and stale rows', async ({ request }) => {
    skipUnlessChromiumProject()

    const now = Date.now()
    const expiredId = await insertNewsletterConfirmation({
      expiresAt: new Date(now - 60 * 60 * 1000),
    })
    const staleId = await insertNewsletterConfirmation({
      expiresAt: new Date(now + dayInMs),
      confirmedAt: new Date(now - 8 * dayInMs),
      createdAt: new Date(now - 8 * dayInMs),
    })

    const response = await request.get('/api/cron/cleanup-confirmations', {
      headers: {
        authorization: cronAuthHeader!,
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as {
      deleted: { expired: number; oldConfirmed: number; total: number }
    }

    expect(body.deleted.expired).toBeGreaterThanOrEqual(1)
    expect(body.deleted.oldConfirmed).toBeGreaterThanOrEqual(1)

    await expectMissingById('newsletter_confirmations', expiredId)
    await expectMissingById('newsletter_confirmations', staleId)
  })

  test('@ready cleanup-dsar-requests prunes fulfilled and expired items', async ({ request }) => {
    skipUnlessChromiumProject()

    const now = Date.now()
    const fulfilledId = await insertDsarRequest({
      fulfilledAt: new Date(now - 31 * dayInMs),
      createdAt: new Date(now - 31 * dayInMs),
    })
    const expiredPendingId = await insertDsarRequest({
      fulfilledAt: null,
      createdAt: new Date(now - 8 * dayInMs),
    })

    const response = await request.get('/api/cron/cleanup-dsar-requests', {
      headers: {
        authorization: cronAuthHeader!,
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as {
      deleted: { fulfilled: number; expired: number; total: number }
    }

    expect(body.deleted.fulfilled).toBeGreaterThanOrEqual(1)
    expect(body.deleted.expired).toBeGreaterThanOrEqual(1)

    await expectMissingById('dsar_requests', fulfilledId)
    await expectMissingById('dsar_requests', expiredPendingId)
  })

  test('@ready ping-integrations validates Astro DB availability', async ({ request }) => {
    skipUnlessChromiumProject()

    const response = await request.get('/api/cron/ping-integrations', {
      headers: {
        authorization: cronAuthHeader!,
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as {
      astroDb: { rowsChecked: number; durationMs: number }
    }

    expect(body.astroDb.rowsChecked).toBeGreaterThanOrEqual(0)
    expect(body.astroDb.durationMs).toBeGreaterThanOrEqual(0)
  })
})
