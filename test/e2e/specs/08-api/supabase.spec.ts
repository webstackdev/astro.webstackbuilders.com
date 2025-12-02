/**
 * Supabase Database Tests
 * Verifies Supabase client environment configuration and row-level security expectations.
 */

import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { env } from 'node:process'
import { expect, test } from '@test/e2e/helpers'

const SUPABASE_URL = env['SUPABASE_URL']?.replace(/\/$/, '')
const SUPABASE_SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
const SUPABASE_ANON_KEY = env['SUPABASE_KEY']
const SUPABASE_RLS_TABLE = 'consent_records'
const SUPABASE_DISABLED = env['E2E_SUPABASE_FALLBACK'] === '1'

const supabaseReady = Boolean(
  !SUPABASE_DISABLED &&
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  SUPABASE_ANON_KEY
)

const createSupabaseClient = (key: string): SupabaseClient =>
  createClient(SUPABASE_URL!, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

const supabaseAdminClient = supabaseReady ? createSupabaseClient(SUPABASE_SERVICE_ROLE_KEY!) : null
const supabaseAnonClient = supabaseReady ? createSupabaseClient(SUPABASE_ANON_KEY!) : null

const TEST_SOURCE = 'supabase_e2e'
const TEST_PRIVACY_VERSION = '1970-01-01'
const TEST_USER_AGENT = 'playwright/supabase'

const createdRecordIds: string[] = []

const skipUnlessChromium = (browserName: string) => {
  test.skip(browserName !== 'chromium', 'Supabase API tests only run once per suite')
}

const buildConsentRecordPayload = () => ({
  'data_subject_id': randomUUID(),
  'email': `supabase-e2e-${randomUUID()}@example.com`,
  'purposes': ['marketing'],
  'source': TEST_SOURCE,
  'user_agent': TEST_USER_AGENT,
  'privacy_policy_version': TEST_PRIVACY_VERSION,
  'consent_text': 'Captured for e2e Supabase coverage',
})

const recordCleanup = async () => {
  if (!supabaseAdminClient || createdRecordIds.length === 0) {
    return
  }

  await supabaseAdminClient
    .from(SUPABASE_RLS_TABLE)
    .delete()
    .in('id', [...createdRecordIds])

  createdRecordIds.length = 0
}

test.afterEach(async () => {
  if (supabaseReady) {
    await recordCleanup()
  }
})

const skipSupabaseReason = !supabaseReady
  ? 'Supabase environment is not configured or fallback mode is enabled.'
  : undefined

test.describe('Supabase Database API', () => {
  test.describe.configure({ mode: 'serial' })
  if (skipSupabaseReason) {
    test.skip(true, skipSupabaseReason)
  }

  test('Supabase Configuration - should use correct environment variables', async ({ browserName }) => {
    skipUnlessChromium(browserName)
    expect(SUPABASE_URL).toBeTruthy()
    expect(SUPABASE_SERVICE_ROLE_KEY).toMatch(/^sb_secret_/)
    expect(SUPABASE_ANON_KEY).toMatch(/^sb_/)

    const { error, count } = await supabaseAdminClient!
      .from(SUPABASE_RLS_TABLE)
      .select('*', { count: 'exact', head: true })

    expect(error).toBeNull()
    expect(typeof count === 'number').toBe(true)
  })

  test('Supabase Configuration - should create clients with proper auth settings', async ({ browserName }) => {
    skipUnlessChromium(browserName)
    const record = buildConsentRecordPayload()
    const { data, error } = await supabaseAdminClient!
      .from(SUPABASE_RLS_TABLE)
      .insert(record)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.source).toBe(TEST_SOURCE)
    createdRecordIds.push(data!.id)

    const { error: anonError } = await supabaseAnonClient!
      .from(SUPABASE_RLS_TABLE)
      .insert(buildConsentRecordPayload())

    expectRlsFailure({ error: anonError })
  })
})

const expectRlsFailure = (result: { error: PostgrestError | null; data?: unknown }) => {
  const { error, data } = result
  if (error) {
    expect(['42501', 'PGRST301']).toContain(error.code)
    return
  }

  if (Array.isArray(data)) {
    expect(data.length).toBe(0)
  } else {
    expect(data ?? null).toBeNull()
  }
}

test.describe('RLS Policies', () => {
  test.describe.configure({ mode: 'serial' })
  if (skipSupabaseReason) {
    test.skip(true, skipSupabaseReason)
  }

  test.describe('Service Role (Admin)', () => {
    test('can insert records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const payload = buildConsentRecordPayload()
      const { data, error } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(payload)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.email).toBe(payload.email)
      createdRecordIds.push(data!.id)
    })

    test('can read records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const insertPayload = buildConsentRecordPayload()
      const { data: inserted } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(insertPayload)
        .select()
        .single()
      createdRecordIds.push(inserted!.id)

      const { data, error } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .select('*')
        .eq('id', inserted!.id)
        .single()

      expect(error).toBeNull()
      expect(data?.email).toBe(insertPayload.email)
    })

    test('can update records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const insertPayload = buildConsentRecordPayload()
      const { data: inserted } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(insertPayload)
        .select()
        .single()
      createdRecordIds.push(inserted!.id)

      const updatedText = 'Updated via admin RLS test'
      const { data, error } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .update(Object.fromEntries([[ 'consent_text', updatedText ]]))
        .eq('id', inserted!.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.consent_text).toBe(updatedText)
    })

    test('can delete records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const insertPayload = buildConsentRecordPayload()
      const { data: inserted } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(insertPayload)
        .select()
        .single()

      const { error } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .delete()
        .eq('id', inserted!.id)

      expect(error).toBeNull()
    })
  })

  test.describe('Public Client (Anon)', () => {
    test('cannot read records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const { data: inserted } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(buildConsentRecordPayload())
        .select()
        .single()
      createdRecordIds.push(inserted!.id)

      const { data, error } = await supabaseAnonClient!
        .from(SUPABASE_RLS_TABLE)
        .select('*')
        .eq('id', inserted!.id)
        .maybeSingle()

      expectRlsFailure({ error, data })
    })

    test('cannot insert records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const { error } = await supabaseAnonClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(buildConsentRecordPayload())

      expectRlsFailure({ error })
    })

    test('cannot update records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const insertPayload = buildConsentRecordPayload()
      const { data: inserted } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(insertPayload)
        .select()
        .single()
      createdRecordIds.push(inserted!.id)

      const { error } = await supabaseAnonClient!
        .from(SUPABASE_RLS_TABLE)
        .update(Object.fromEntries([[ 'consent_text', 'anon cannot edit' ]]))
        .eq('id', inserted!.id)

      expectRlsFailure({ error })
    })

    test('cannot delete records', async ({ browserName }) => {
      skipUnlessChromium(browserName)
      const insertPayload = buildConsentRecordPayload()
      const { data: inserted } = await supabaseAdminClient!
        .from(SUPABASE_RLS_TABLE)
        .insert(insertPayload)
        .select()
        .single()
      createdRecordIds.push(inserted!.id)

      const { error } = await supabaseAnonClient!
        .from(SUPABASE_RLS_TABLE)
        .delete()
        .eq('id', inserted!.id)

      expectRlsFailure({ error })
    })
  })
})

