import { createClient } from '@supabase/supabase-js'
import { getSuprabaseApiServiceRoleKey, getSuprabaseApiUrl } from '@pages/api/_environment/environmentApi'

// Admin client (server-side only, bypasses RLS)
export const supabaseAdmin = createClient(
  getSuprabaseApiUrl(),
  getSuprabaseApiServiceRoleKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
