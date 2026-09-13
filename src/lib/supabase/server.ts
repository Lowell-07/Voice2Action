import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const configuredUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = configuredUrl?.startsWith('http://') || configuredUrl?.startsWith('https://')
  ? configuredUrl
  : 'https://lsuosxjvkxwkccnwcgvu.supabase.co';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    if (!serviceRoleKey) {
      console.warn('[Supabase Server] Missing SUPABASE_SERVICE_ROLE_KEY, falling back to anon key.');
    }
    serverClientInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverClientInstance;
}

export const supabaseServer = getSupabaseServerClient();
