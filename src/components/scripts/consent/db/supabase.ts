import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL} from 'astro:env/client'

// Public client (client-side, respects RLS)
export const supabasePublic = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)
