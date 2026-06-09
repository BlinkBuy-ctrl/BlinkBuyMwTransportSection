import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const missingUrl = !supabaseUrl  || supabaseUrl  === 'undefined' || supabaseUrl.includes('your-project')
const missingKey = !supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey.includes('your-supabase')

if (missingUrl || missingKey) {
  console.error(
    '[TransportMW] Supabase env vars missing or are still placeholder values.\n' +
    '  VITE_SUPABASE_URL      = ' + (supabaseUrl  ?? '(not set)') + '\n' +
    '  VITE_SUPABASE_ANON_KEY = ' + (supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '…' : '(not set)') + '\n\n' +
    '  Fix: set both in Vercel/Netlify → Environment Variables, then REDEPLOY.\n' +
    '  Vite bakes vars at build time — saving vars without rebuilding does nothing.'
  )
}

export const supabaseConfigured = !missingUrl && !missingKey

// Base client — used for all public reads (listings, reviews, etc.)
export const supabase = createClient(
  missingUrl  ? 'https://placeholder.supabase.co' : supabaseUrl!,
  missingKey  ? 'eyJplaceholder' : supabaseAnonKey!,
  {
    auth: {
      persistSession:     false,
      autoRefreshToken:   false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'X-Client-Info': 'transportmw/1.0' },
    },
  }
)

/**
 * Returns a Supabase client that injects x-operator-token into every request.
 * Use this for any operation that depends on RLS (insert, update, delete,
 * or reading the operator's own private listings / notifications / bookings).
 *
 * Usage:
 *   const client = authedClient(identity.token)
 *   await client.from('listings').insert(payload)
 */
export function authedClient(operatorToken: string) {
  return createClient(
    missingUrl  ? 'https://placeholder.supabase.co' : supabaseUrl!,
    missingKey  ? 'eyJplaceholder' : supabaseAnonKey!,
    {
      auth: {
        persistSession:     false,
        autoRefreshToken:   false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info':    'transportmw/1.0',
          'x-operator-token': operatorToken,
        },
      },
    }
  )
}
