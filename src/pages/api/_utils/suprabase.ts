import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { captureException } from '@sentry/astro'
import { ensureApiSentry } from '@pages/api/_sentry'
import { getSuprabaseApiServiceRoleKey, getSuprabaseApiUrl, isProd } from '@pages/api/_environment/environmentApi'
import { ApiFunctionError, normalizeUnknownApiError } from '@pages/api/_errors/ApiFunctionError'

let cachedSupabaseAdmin: SupabaseClient | null = null
let supabaseInitError: ApiFunctionError | null = null
let hasLoggedInitError = false

const SUPABASE_INIT_FALLBACK_MESSAGE = 'Failed to initialize Supabase admin client.'
const SUPABASE_INIT_OPERATION = 'supabaseAdmin.initialize'
const SUPABASE_INIT_ERROR_CODE = 'SUPABASE_INIT_FAILED'

const logSupabaseInitError = (error: Error) => {
  if (hasLoggedInitError) {
    return
  }

  hasLoggedInitError = true

  if (isProd()) {
    ensureApiSentry()
    captureException(error)
  } else {
    console.error('[supabaseAdmin] Failed to initialize Supabase admin client:', error)
  }
}

const getSupabaseAdminClient = (): SupabaseClient => {
  if (cachedSupabaseAdmin) {
    return cachedSupabaseAdmin
  }

  if (supabaseInitError) {
    throw supabaseInitError
  }

  try {
    cachedSupabaseAdmin = createClient(
      getSuprabaseApiUrl(),
      getSuprabaseApiServiceRoleKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    return cachedSupabaseAdmin
  } catch (error) {
    const normalizedError = normalizeUnknownApiError(error, SUPABASE_INIT_FALLBACK_MESSAGE)
    const apiError = ApiFunctionError.from(normalizedError, {
      status: 500,
      code: SUPABASE_INIT_ERROR_CODE,
      operation: SUPABASE_INIT_OPERATION,
      details: {
        message: normalizedError.message,
      },
    })

    supabaseInitError = apiError
    logSupabaseInitError(apiError)
    throw apiError
  }
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabaseAdminClient()
    const value = Reflect.get(client, property, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export const __resetSupabaseAdminForTests = () => {
  cachedSupabaseAdmin = null
  supabaseInitError = null
  hasLoggedInitError = false
}
