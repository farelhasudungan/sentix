import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build errors when env vars aren't set
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL
  if (!url) {
    throw new Error('SUPABASE_URL is not set. Please add it to your .env.local file.')
  }
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.')
  }
  return key
}

// Client for browser (uses anon key with RLS)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _supabase
}

// For backwards compatibility
export const supabase = {
  get from() {
    return getSupabase().from.bind(getSupabase())
  },
  get auth() {
    return getSupabase().auth
  },
}

// Admin client for server-side operations (bypasses RLS)
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env.local file.')
    }
    _supabaseAdmin = createClient(getSupabaseUrl(), serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _supabaseAdmin
}

// Admin wallet addresses that can manage tournaments
export const ADMIN_WALLETS = [
  // Add your admin wallet addresses here (lowercase)
  '0x6d8ef57d063177E1e3113D38002731b851d4A794', // Replace with actual admin wallet
].map(addr => addr.toLowerCase())

export function isAdminWallet(address: string | undefined): boolean {
  if (!address) return false
  return ADMIN_WALLETS.includes(address.toLowerCase())
}
