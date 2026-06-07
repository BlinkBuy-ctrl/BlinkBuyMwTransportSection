import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[BlinkBuy] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your Netlify/Vercel environment variables.')
}

// Guard: createClient with placeholder values so the module doesn't throw
// during parse when env vars are absent (causes blank screen).
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'transport_auth_token',
      // Use a safe accessor — window is undefined during SSR/prerender
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: { headers: { 'X-Client-Info': 'transport-standalone' } },
  }
)
