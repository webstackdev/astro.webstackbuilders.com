import { expect, test } from '@test/e2e/helpers'
import { ensureCronDependenciesHealthy } from '@test/e2e/helpers/cronHealth'
/**
 * These env helpers are safe to use in E2E test as they call process.env
 * directly. Must use "npm run dev:env" for this test case to pass.
 */
import { getCronSecret } from '@pages/api/_environment/environmentApi'
import {
  deleteDsarRequestById,
  deleteNewsletterConfirmationById,
  findDsarRequestById,
  findNewsletterConfirmationById,
  insertDsarRequest,
  insertNewsletterConfirmation,
} from '@test/e2e/db'

const CRON_SECRET = getCronSecret()

const skipReason = (() => {
  if (!CRON_SECRET) {
    return 'CRON_SECRET must be configured to call cron endpoints'
  }
  return null
})()

const cronAuthHeader = CRON_SECRET ? `Bearer ${CRON_SECRET}` : null

const skipUnlessChromiumProject = () => {
  const projectName = test.info().project.name
  test.skip(projectName !== 'chromium', 'Cron tests run once via chromium project to avoid duplicates')
}

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

  if (skipReason) {
    test.skip(true, skipReason)
  } else {
    test.beforeAll(async () => {
      await ensureCronDependenciesHealthy()
    })
  }

  test.afterEach(async () => {
    await cleanupConfirmations()
    await cleanupDsarRequests()
  })

  test('@ready cleanup-confirmations removes expired and stale rows', async ({ request }) => {
    skipUnlessChromiumProject()

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
        authorization: cronAuthHeader!,
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as {
      deleted: { expired: number; oldConfirmed: number; total: number }
    }

    expect(body.deleted.expired).toBeGreaterThanOrEqual(1)
    expect(body.deleted.oldConfirmed).toBeGreaterThanOrEqual(1)

    await expectNewsletterMissing(expiredId)
    await expectNewsletterMissing(staleId)
  })

  test('@ready cleanup-dsar-requests prunes fulfilled and expired items', async ({ request }) => {
    skipUnlessChromiumProject()

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
        authorization: cronAuthHeader!,
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as {
      deleted: { fulfilled: number; expired: number; total: number }
    }

    expect(body.deleted.fulfilled).toBeGreaterThanOrEqual(1)
    expect(body.deleted.expired).toBeGreaterThanOrEqual(1)

    await expectDsarMissing(fulfilledId)
    await expectDsarMissing(expiredPendingId)
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
