import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env['SUPABASE_URL']!

// Admin client (server-side only, bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  import.meta.env['SUPABASE_SERVICE_ROLE_KEY']!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Public client (client-side, respects RLS)
export const supabasePublic = createClient(
  supabaseUrl,
  import.meta.env['SUPABASE_KEY']!
)
