// Supabase admin client for server-side API routes only. Never import this
// from a client component: it holds the service_role key, which bypasses RLS.

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.")
  }

  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}
