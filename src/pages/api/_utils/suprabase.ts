import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from 'astro:env/client'
import { SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server'

// Admin client (server-side only, bypasses RLS)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
