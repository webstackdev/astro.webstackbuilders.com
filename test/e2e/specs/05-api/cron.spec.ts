import { expect, test } from '@test/e2e/helpers'
import { ensureCronDependenciesHealthy } from '@test/e2e/helpers/cronHealth'
import {
  deleteDsarRequestById,
  deleteNewsletterConfirmationById,
  findDsarRequestById,
  findNewsletterConfirmationById,
  insertDsarRequest,
  insertNewsletterConfirmation,
} from '@test/e2e/db'

const cronSecretEnvHelp =
  "CRON_SECRET must be configured to call cron endpoints. " +
  "Are you running in a local environment and forgot to use 'npm run dev:local'?"

const cronSecret = process.env['CRON_SECRET']?.trim()
const cronAuthHeader = cronSecret ? `Bearer ${cronSecret}` : null
const dayInMs = 24 * 60 * 60 * 1000
const createdConfirmationIds: string[] = []
const createdDsarIds: string[] = []

const queueCleanup = (bucket: string[], id: string) => {
  bucket.push(id)
  return id
}

const cleanupConfirmations = async () => {
  await Promise.all(createdConfirmationIds.map((id) => deleteNewsletterConfirmationById(id)))
  createdConfirmationIds.length = 0
}

const cleanupDsarRequests = async () => {
  await Promise.all(createdDsarIds.map((id) => deleteDsarRequestById(id)))
  createdDsarIds.length = 0
}

const seedNewsletterConfirmation = async (options: {
  expiresAt: Date
  confirmedAt?: Date | null
  createdAt?: Date
}) => {
  const record = await insertNewsletterConfirmation({
    expiresAt: options.expiresAt,
    confirmedAt: options.confirmedAt ?? null,
    ...(options.createdAt ? { createdAt: options.createdAt } : {}),
  })
  return queueCleanup(createdConfirmationIds, record.id)
}

const seedDsarRequest = async (options: {
  fulfilledAt?: Date | null
  createdAt?: Date
}) => {
  const record = await insertDsarRequest({
    fulfilledAt: options.fulfilledAt ?? null,
    ...(options.createdAt ? { createdAt: options.createdAt } : {}),
  })
  return queueCleanup(createdDsarIds, record.id)
}

const expectNewsletterMissing = async (id: string) => {
  const row = await findNewsletterConfirmationById(id)
  expect(row).toBeNull()
}

const expectDsarMissing = async (id: string) => {
  const row = await findDsarRequestById(id)
  expect(row).toBeNull()
}

test.describe('Cron API endpoints @ready', () => {
  test.describe.configure({ mode: 'serial' })

  test('@ready CRON_SECRET is configured', async () => {
    expect(cronSecret, cronSecretEnvHelp).toBeTruthy()
  })

  if (cronSecret && cronAuthHeader) {
    test.beforeAll(async () => {
      await ensureCronDependenciesHealthy()
    })

    test.afterEach(async () => {
      await cleanupConfirmations()
      await cleanupDsarRequests()
    })

    test('@ready cleanup-confirmations removes expired and stale rows', async ({ request }) => {

      const now = Date.now()
      const expiredId = await seedNewsletterConfirmation({
        expiresAt: new Date(now - 60 * 60 * 1000),
      })
      const staleId = await seedNewsletterConfirmation({
        expiresAt: new Date(now + dayInMs),
        confirmedAt: new Date(now - 8 * dayInMs),
        createdAt: new Date(now - 8 * dayInMs),
      })

      const response = await request.get('/api/cron/cleanup-confirmations', {
        headers: {
          authorization: cronAuthHeader,
        },
      })

      const status = response.status()
      const rawBody = await response.text()
      expect(response.ok(), `Cron request failed: ${status} ${rawBody}`).toBeTruthy()

      const body = JSON.parse(rawBody) as {
        deleted: { expired: number; oldConfirmed: number; total: number }
      }

      expect(body.deleted.expired).toBeGreaterThanOrEqual(1)
      expect(body.deleted.oldConfirmed).toBeGreaterThanOrEqual(1)

      await expectNewsletterMissing(expiredId)
      await expectNewsletterMissing(staleId)
    })

    test('@ready cleanup-dsar-requests prunes fulfilled and expired items', async ({ request }) => {

      const now = Date.now()
      const fulfilledId = await seedDsarRequest({
        fulfilledAt: new Date(now - 31 * dayInMs),
        createdAt: new Date(now - 31 * dayInMs),
      })
      const expiredPendingId = await seedDsarRequest({
        fulfilledAt: null,
        createdAt: new Date(now - 8 * dayInMs),
      })

      const response = await request.get('/api/cron/cleanup-dsar-requests', {
        headers: {
          authorization: cronAuthHeader,
        },
      })

      const status = response.status()
      const rawBody = await response.text()
      expect(response.ok(), `Cron request failed: ${status} ${rawBody}`).toBeTruthy()

      const body = JSON.parse(rawBody) as {
        deleted: { fulfilled: number; expired: number; total: number }
      }

      expect(body.deleted.fulfilled).toBeGreaterThanOrEqual(1)
      expect(body.deleted.expired).toBeGreaterThanOrEqual(1)

      await expectDsarMissing(fulfilledId)
      await expectDsarMissing(expiredPendingId)
    })
  }

})
