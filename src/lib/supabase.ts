import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const missingUrl = !supabaseUrl  || supabaseUrl  === 'undefined' || supabaseUrl.includes('your-project')
const missingKey = !supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey.includes('your-supabase')

if (missingUrl || missingKey) {
  console.error(
    '[TransportMW] ─────────────────────────────────────────────────────\n' +
    '[TransportMW] Supabase env vars are missing or still placeholders.\n' +
    '[TransportMW]\n' +
    '[TransportMW]  VITE_SUPABASE_URL      = ' + (supabaseUrl ?? '(not set)') + '\n' +
    '[TransportMW]  VITE_SUPABASE_ANON_KEY = ' + (supabaseAnonKey ? supabaseAnonKey.slice(0,20)+'…' : '(not set)') + '\n' +
    '[TransportMW]\n' +
    '[TransportMW]  Steps to fix:\n' +
    '[TransportMW]  1. Go to supabase.com → your project → Settings → API\n' +
    '[TransportMW]  2. Copy "Project URL" and "anon public" key\n' +
    '[TransportMW]  3. Add both to Vercel/Netlify → Environment Variables\n' +
    '[TransportMW]  4. REDEPLOY — Vite bakes these at build time, saving\n' +
    '[TransportMW]     vars without rebuilding does absolutely nothing.\n' +
    '[TransportMW] ─────────────────────────────────────────────────────'
  )
}

export const supabaseConfigured = !missingUrl && !missingKey

// Single shared client — no custom headers needed.
// RLS policies now validate ownership via the row data (operator_token column),
// not via request headers. The app enforces token matching in every query with
// .eq("operator_token", identity.token) so only the owner can ever match.
export const supabase = createClient(
  missingUrl ? 'https://placeholder.supabase.co' : supabaseUrl!,
  missingKey ? 'eyJplaceholder'                  : supabaseAnonKey!,
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

// Kept for backwards compatibility — just returns the shared client.
// Previously created a separate client with x-operator-token header,
// but Supabase PostgREST does not forward custom headers to Postgres
// for anon key requests, so that approach never worked.
export function authedClient(_operatorToken: string) {
  return supabase
}
