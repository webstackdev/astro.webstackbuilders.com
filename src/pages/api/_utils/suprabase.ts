import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { captureException } from '@sentry/astro'
import { ensureApiSentry } from '@pages/api/_sentry'
import { getSuprabaseApiServiceRoleKey, getSuprabaseApiUrl, isProd } from '@pages/api/_environment/environmentApi'

let cachedSupabaseAdmin: SupabaseClient | null = null
let supabaseInitError: Error | null = null
let hasLoggedInitError = false

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
    const normalizedError = error instanceof Error ? error : new Error(String(error))
    supabaseInitError = normalizedError
    logSupabaseInitError(normalizedError)
    throw normalizedError
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
